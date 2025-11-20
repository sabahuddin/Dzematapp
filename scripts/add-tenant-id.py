#!/usr/bin/env python3
"""
Script to add tenantId to all storage method calls in routes.ts
Handles systematic update of ~300 storage calls across ~180 routes
"""

import re
import sys

def process_routes_file(file_path):
    """Process routes.ts and add tenantId to all storage calls"""
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.split('\n')
    result_lines = []
    
    in_route_handler = False
    route_handler_indent = 0
    handler_has_storage_call = False
    handler_has_tenant_id = False
    route_start_line = -1
    is_login_route = False
    
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Check if this is a route definition
        route_match = re.match(r'^  app\.(get|post|put|delete|patch)\(', line)
        
        if route_match:
            # Start tracking a new route handler
            in_route_handler = True
            handler_has_storage_call = False
            handler_has_tenant_id = False
            route_start_line = i
            
            # Check if this is the login route (should NOT add tenantId before getUserByUsername)
            is_login_route = '"/api/auth/login"' in line
            
            result_lines.append(line)
            i += 1
            
            # Find the async function start (next line typically)
            while i < len(lines):
                line = lines[i]
                result_lines.append(line)
                
                # Look for the function body start
                if re.search(r'async\s*\(req,\s*res\)\s*=>\s*\{', line):
                    # Found the start of the handler function
                    route_handler_indent = len(line) - len(line.lstrip())
                    
                    # Look ahead to see if this handler has storage calls
                    temp_i = i + 1
                    brace_count = 1
                    has_storage = False
                    has_tenant_const = False
                    
                    while temp_i < len(lines) and brace_count > 0:
                        temp_line = lines[temp_i]
                        
                        # Count braces
                        brace_count += temp_line.count('{') - temp_line.count('}')
                        
                        # Check for storage calls
                        if 'storage.' in temp_line and 'await' in temp_line:
                            has_storage = True
                        
                        # Check if tenantId already exists
                        if re.search(r'const\s+tenantId\s*=\s*req\.tenantId', temp_line):
                            has_tenant_const = True
                        
                        if brace_count == 0:
                            break
                        temp_i += 1
                    
                    handler_has_storage_call = has_storage
                    handler_has_tenant_id = has_tenant_const
                    
                    # Add tenantId constant if needed (and not login route)
                    if has_storage and not has_tenant_const and not is_login_route:
                        i += 1
                        # Skip try block line if present
                        while i < len(lines) and lines[i].strip() in ['try {', '']:
                            result_lines.append(lines[i])
                            i += 1
                        
                        # Add the tenantId constant
                        indent = ' ' * (route_handler_indent + 4)
                        result_lines.append(f'{indent}const tenantId = req.tenantId!;')
                        continue
                    break
                i += 1
            continue
        
        # Process storage method calls
        if 'await storage.' in line:
            updated_line = update_storage_call(line, is_login_route)
            result_lines.append(updated_line)
        else:
            result_lines.append(line)
        
        i += 1
    
    return '\n'.join(result_lines)


def update_storage_call(line, is_login_route=False):
    """Update a single storage method call to include tenantId"""
    
    # Skip if this is in the login route's getUserByUsername call (we handle it specially)
    if is_login_route and 'getUserByUsername' in line:
        return line  # Will be handled separately
    
    # Pattern 1: getXxx(id) -> getXxx(id, tenantId)
    # Examples: getUser(id), getAnnouncement(id), getEvent(id)
    patterns_get_by_id = [
        (r'(storage\.get\w+)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
    ]
    
    # Pattern 2: getAllXxx() -> getAllXxx(tenantId)
    # Examples: getAllUsers(), getAllAnnouncements()
    patterns_get_all = [
        (r'(storage\.getAll\w+)\(\)(?!\s*,)', r'\1(tenantId)'),
    ]
    
    # Pattern 3: updateXxx(id, data) -> updateXxx(id, tenantId, data)
    # Examples: updateUser(id, userData), updateAnnouncement(id, data)
    patterns_update = [
        (r'(storage\.update\w+)\(([^,]+),\s*(?!tenantId)', r'\1(\2, tenantId, '),
    ]
    
    # Pattern 4: deleteXxx(id) -> deleteXxx(id, tenantId)
    patterns_delete = [
        (r'(storage\.delete\w+)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
    ]
    
    # Pattern 5: Special patterns for methods with multiple params
    # isUserMemberOfWorkGroup(workGroupId, userId) -> isUserMemberOfWorkGroup(workGroupId, userId, tenantId)
    patterns_multi_param = [
        (r'(storage\.isUser\w+)\(([^,]+),\s*([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, \3, tenantId)'),
        (r'(storage\.addMemberToWorkGroup)\(([^,]+),\s*([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, \3, tenantId)'),
        (r'(storage\.removeMemberFromWorkGroup)\(([^,]+),\s*([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, \3, tenantId)'),
        (r'(storage\.getUserEventRsvp)\(([^,]+),\s*([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, \3, tenantId)'),
        (r'(storage\.getWorkGroupMembers)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.getUserWorkGroups)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.getTasksByWorkGroup)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.getUserAccessRequests)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.getTaskComments)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.getAnnouncementFiles)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.getUserFamilyRelationships)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.getMessages)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.getConversations)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.getUnreadCount)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.getUserMarketplaceItems)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.getUserServices)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.getPrayerTimeByDate)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.getUserFinancialContributions)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.getUserActivityLog)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.getUserEventAttendance)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.getUserBadges)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.getUserProjects)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.getUserPreferences)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.getUserRequests)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.getUserCertificates)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.getUserByEmail)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.getUserByUsername)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.markAsRead)\(([^,]+),\s*([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, \3, tenantId)'),
        (r'(storage\.markThreadAsRead)\(([^,]+),\s*([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, \3, tenantId)'),
        (r'(storage\.getMessageThread)\(([^,]+),\s*([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, \3, tenantId)'),
        (r'(storage\.answerImamQuestion)\(([^,]+),\s*([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId, \3)'),
        (r'(storage\.markQuestionAsRead)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.updateLastViewed)\(([^,]+),\s*([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId, \3)'),
        (r'(storage\.getNewItemsCount)\(([^,]+),\s*([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId, \3)'),
        (r'(storage\.getAllTasksWithWorkGroup)\(([^,]+),\s*([^,)]+)\)(?!,\s*tenantId)', r'\1(tenantId, \2, \3)'),
        (r'(storage\.getAllWorkGroups)\(([^,]+),\s*([^,)]+)\)(?!,\s*tenantId)', r'\1(tenantId, \2, \3)'),
        (r'(storage\.getFamilyMembersByRelationship)\(([^,]+),\s*([^,]+)\)(?!,\s*tenantId)', r'\1(\2, \3, tenantId)'),
        (r'(storage\.setModerator)\(([^,]+),\s*([^,]+),\s*([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, \3, tenantId, \4)'),
        (r'(storage\.moveTaskToWorkGroup)\(([^,]+),\s*([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, \3, tenantId)'),
        (r'(storage\.updateEventRsvp)\(([^,]+),\s*\{', r'\1(\2, tenantId, {'),
        (r'(storage\.deleteEventRsvp)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.isUserModeratorOfWorkGroup)\(([^,]+),\s*([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, \3, tenantId)'),
        (r'(storage\.getWorkGroupModerators)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.deleteTaskComment)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.deleteFamilyRelationship)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.deleteMessage)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.deleteImamQuestion)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.getOrganizationSettings)\(\)(?!\s*,)', r'\1(tenantId)'),
        (r'(storage\.updateOrganizationSettings)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(tenantId, \2)'),
        (r'(storage\.getPointsSettings)\(\)(?!\s*,)', r'\1(tenantId)'),
        (r'(storage\.updatePointsSettings)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(tenantId, \2)'),
        (r'(storage\.getUserCount)\(\)(?!\s*,)', r'\1(tenantId)'),
        (r'(storage\.getNewAnnouncementsCount)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(tenantId, \2)'),
        (r'(storage\.getUpcomingEventsCount)\(\)(?!\s*,)', r'\1(tenantId)'),
        (r'(storage\.getActiveTasksCount)\(\)(?!\s*,)', r'\1(tenantId)'),
        (r'(storage\.getPendingAccessRequestsCount)\(([^,)]*)\)(?!,\s*tenantId)', r'\1(tenantId, \2)'),
        (r'(storage\.getAllNewItemsCounts)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.getRecentActivities)\(([^,)]*)\)(?!,\s*tenantId)', r'\1(tenantId, \2)'),
        (r'(storage\.getImamQuestions)\(\)(?!\s*,)', r'\1(tenantId)'),
        (r'(storage\.getImamQuestions)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(tenantId, \2)'),
        (r'(storage\.getUnansweredQuestionsCount)\(\)(?!\s*,)', r'\1(tenantId)'),
        (r'(storage\.getAllServicesWithUsers)\(\)(?!\s*,)', r'\1(tenantId)'),
        (r'(storage\.getAllProductPurchaseRequests)\(\)(?!\s*,)', r'\1(tenantId)'),
        (r'(storage\.updateProductPurchaseRequest)\(([^,]+),\s*([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId, \3)'),
        (r'(storage\.getEventAttendance)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.getUserTotalDonations)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.deleteContributionWithLogs)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.checkBadgeEligibility)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.getProjectWithDetails)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.getProjectContributions)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.getProjectProposals)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.updateAnnouncementFeed)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.updateUserPoints)\(([^,]+),\s*([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId, \3)'),
        (r'(storage\.updateRequestStatus)\(([^,]+),\s*([^,]+),\s*([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId, \3, \4)'),
        (r'(storage\.deletePrayerTime)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.deleteAllPrayerTimes)\(\)(?!\s*,)', r'\1(tenantId)'),
        (r'(storage\.getEventRsvps)\(([^,)]+)\)(?!,\s*tenantId)', r'\1(\2, tenantId)'),
        (r'(storage\.getEventLocations)\(\)(?!\s*,)', r'\1(tenantId)'),
    ]
    
    # Apply patterns in order
    updated_line = line
    
    # Try multi-param patterns first (they're more specific)
    for pattern, replacement in patterns_multi_param:
        if re.search(pattern, updated_line):
            updated_line = re.sub(pattern, replacement, updated_line)
            return updated_line
    
    # Try update patterns
    for pattern, replacement in patterns_update:
        if re.search(pattern, updated_line):
            updated_line = re.sub(pattern, replacement, updated_line)
            return updated_line
    
    # Try delete patterns
    for pattern, replacement in patterns_delete:
        if re.search(pattern, updated_line):
            updated_line = re.sub(pattern, replacement, updated_line)
            return updated_line
    
    # Try get by id patterns
    for pattern, replacement in patterns_get_by_id:
        if re.search(pattern, updated_line):
            updated_line = re.sub(pattern, replacement, updated_line)
            return updated_line
    
    # Try get all patterns
    for pattern, replacement in patterns_get_all:
        if re.search(pattern, updated_line):
            updated_line = re.sub(pattern, replacement, updated_line)
            return updated_line
    
    return updated_line


if __name__ == '__main__':
    input_file = 'server/routes.ts'
    output_file = 'server/routes.ts'
    
    print(f"Processing {input_file}...")
    result = process_routes_file(input_file)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(result)
    
    print(f"✓ Updated {output_file}")
    print("Please review the changes and test the application.")
