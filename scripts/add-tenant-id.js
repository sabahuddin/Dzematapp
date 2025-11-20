#!/usr/bin/env node

const fs = require('fs');

function processRoutesFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const resultLines = [];
  
  let inRouteHandler = false;
  let routeHandlerIndent = 0;
  let isLoginRoute = false;
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    
    // Check if this is a route definition
    const routeMatch = line.match(/^  app\.(get|post|put|delete|patch)\(/);
    
    if (routeMatch) {
      isLoginRoute = line.includes('"/api/auth/login"');
      resultLines.push(line);
      i++;
      
      // Find the async function start
      while (i < lines.length) {
        const currentLine = lines[i];
        resultLines.push(currentLine);
        
        // Look for the function body start
        if (currentLine.match(/async\s*\(req,\s*res\)\s*=>\s*\{/)) {
          routeHandlerIndent = currentLine.length - currentLine.trimStart().length;
          
          // Look ahead to see if this handler has storage calls and needs tenantId
          let tempI = i + 1;
          let braceCount = 1;
          let hasStorage = false;
          let hasTenantConst = false;
          
          while (tempI < lines.length && braceCount > 0) {
            const tempLine = lines[tempI];
            braceCount += (tempLine.match(/\{/g) || []).length - (tempLine.match(/\}/g) || []).length;
            
            if (tempLine.includes('storage.') && tempLine.includes('await')) {
              hasStorage = true;
            }
            
            if (tempLine.match(/const\s+tenantId\s*=\s*req\.tenantId/)) {
              hasTenantConst = true;
            }
            
            if (braceCount === 0) break;
            tempI++;
          }
          
          // Add tenantId constant if needed (and not login route)
          if (hasStorage && !hasTenantConst && !isLoginRoute) {
            i++;
            // Skip try block line if present
            while (i < lines.length && (lines[i].trim() === 'try {' || lines[i].trim() === '')) {
              resultLines.push(lines[i]);
              i++;
            }
            
            // Add the tenantId constant
            const indent = ' '.repeat(routeHandlerIndent + 4);
            resultLines.push(`${indent}const tenantId = req.tenantId!;`);
            continue;
          }
          break;
        }
        i++;
      }
      continue;
    }
    
    // Process storage method calls
    if (line.includes('await storage.')) {
      const updatedLine = updateStorageCall(line, isLoginRoute);
      resultLines.push(updatedLine);
    } else {
      resultLines.push(line);
    }
    
    i++;
  }
  
  return resultLines.join('\n');
}

function updateStorageCall(line, isLoginRoute = false) {
  // Skip if tenantId already present
  if (line.includes(', tenantId')) {
    return line;
  }
  
  let updated = line;
  
  // Special methods - order matters (most specific first)
  const patterns = [
    // 3-param methods
    [/storage\.getAllTasksWithWorkGroup\(([^,]+),\s*([^,]+)\)/, 'storage.getAllTasksWithWorkGroup(tenantId, $1, $2)'],
    [/storage\.getAllWorkGroups\(([^,]+),\s*([^,]+)\)/, 'storage.getAllWorkGroups(tenantId, $1, $2)'],
    [/storage\.setModerator\(([^,]+),\s*([^,]+),\s*([^,)]+)\)/, 'storage.setModerator($1, $2, tenantId, $3)'],
    [/storage\.getFamilyMembersByRelationship\(([^,]+),\s*([^,]+)\)/, 'storage.getFamilyMembersByRelationship($1, $2, tenantId)'],
    [/storage\.isUserMemberOfWorkGroup\(([^,]+),\s*([^,]+)\)/, 'storage.isUserMemberOfWorkGroup($1, $2, tenantId)'],
    [/storage\.isUserModeratorOfWorkGroup\(([^,]+),\s*([^,]+)\)/, 'storage.isUserModeratorOfWorkGroup($1, $2, tenantId)'],
    [/storage\.addMemberToWorkGroup\(([^,]+),\s*([^,]+)\)/, 'storage.addMemberToWorkGroup($1, $2, tenantId)'],
    [/storage\.removeMemberFromWorkGroup\(([^,]+),\s*([^,]+)\)/, 'storage.removeMemberFromWorkGroup($1, $2, tenantId)'],
    [/storage\.getUserEventRsvp\(([^,]+),\s*([^,]+)\)/, 'storage.getUserEventRsvp($1, $2, tenantId)'],
    [/storage\.markAsRead\(([^,]+),\s*([^,]+)\)/, 'storage.markAsRead($1, $2, tenantId)'],
    [/storage\.markThreadAsRead\(([^,]+),\s*([^,]+)\)/, 'storage.markThreadAsRead($1, $2, tenantId)'],
    [/storage\.getMessageThread\(([^,]+),\s*([^,]+)\)/, 'storage.getMessageThread($1, $2, tenantId)'],
    [/storage\.answerImamQuestion\(([^,]+),\s*([^,)]+)\)/, 'storage.answerImamQuestion($1, tenantId, $2)'],
    [/storage\.updateLastViewed\(([^,]+),\s*([^,)]+)\)/, 'storage.updateLastViewed($1, tenantId, $2)'],
    [/storage\.getNewItemsCount\(([^,]+),\s*([^,)]+)\)/, 'storage.getNewItemsCount($1, tenantId, $2)'],
    [/storage\.moveTaskToWorkGroup\(([^,]+),\s*([^,)]+)\)/, 'storage.moveTaskToWorkGroup($1, $2, tenantId)'],
    [/storage\.updateProductPurchaseRequest\(([^,]+),\s*([^,)]+)\)/, 'storage.updateProductPurchaseRequest($1, tenantId, $2)'],
    [/storage\.updateRequestStatus\(([^,]+),\s*([^,]+),\s*([^,)]+)\)/, 'storage.updateRequestStatus($1, tenantId, $2, $3)'],
    
    // Update methods - updateXxx(id, data) -> updateXxx(id, tenantId, data)
    [/storage\.(update[A-Z]\w+)\(([^,]+),\s*(?!\s*tenantId)/, 'storage.$1($2, tenantId, '],
    
    // updateEventRsvp special case
    [/storage\.updateEventRsvp\(([^,]+),\s*\{/, 'storage.updateEventRsvp($1, tenantId, {'],
    
    // Single param get methods
    [/storage\.(getUser|getAnnouncement|getEvent|getWorkGroup|getTask|getAccessRequest|getTaskComment|getAnnouncementFile|getFamilyRelationship|getImamQuestion|getDocument|getRequest|getShopProduct|getMarketplaceItem|getService|getImportantDate|getFinancialContribution|getBadge|getProject|getProposal|getReceipt|getCertificateTemplate|getUserCertificate|getMembershipApplication|getAkikaApplication|getMarriageApplication)\(([^,)]+)\)/, 'storage.$1($2, tenantId)'],
    
    // Delete methods
    [/storage\.(delete[A-Z]\w+)\(([^,)]+)\)/, 'storage.$1($2, tenantId)'],
    
    // getUserXxx methods
    [/storage\.(getUserByUsername|getUserByEmail|getWorkGroupMembers|getUserWorkGroups|getTasksByWorkGroup|getUserAccessRequests|getTaskComments|getAnnouncementFiles|getUserFamilyRelationships|getMessages|getConversations|getUnreadCount|getUserMarketplaceItems|getUserServices|getUserFinancialContributions|getUserActivityLog|getUserEventAttendance|getUserBadges|getUserProjects|getUserPreferences|getUserRequests|getUserCertificates|getWorkGroupModerators|getPrayerTimeByDate|getUserTotalDonations|getEventAttendance|getProjectContributions|getProjectProposals)\(([^,)]+)\)/, 'storage.$1($2, tenantId)'],
    
    // No-param methods
    [/storage\.(getAllUsers|getAllAnnouncements|getAllEvents|getAllWorkGroups|getAllAccessRequests|getAllDocuments|getAllRequests|getAllShopProducts|getAllMarketplaceItems|getAllServices|getAllServicesWithUsers|getAllProductPurchaseRequests|getAllPrayerTimes|getAllImportantDates|getAllFinancialContributions|getAllActivityLogs|getAllBadges|getAllProjects|getAllProposals|getAllReceipts|getAllCertificateTemplates|getAllUserCertificates|getAllMembershipApplications|getAllAkikaApplications|getAllMarriageApplications|getOrganizationSettings|getPointsSettings|getUserCount|getUpcomingEventsCount|getActiveTasksCount|getImamQuestions|getUnansweredQuestionsCount|getEventLocations|deleteAllPrayerTimes)\(\)/, 'storage.$1(tenantId)'],
    
    // Special methods with parameters
    [/storage\.getNewAnnouncementsCount\(([^,)]+)\)/, 'storage.getNewAnnouncementsCount(tenantId, $1)'],
    [/storage\.getPendingAccessRequestsCount\(([^,)]*)\)/, 'storage.getPendingAccessRequestsCount(tenantId, $1)'],
    [/storage\.getAllNewItemsCounts\(([^,)]+)\)/, 'storage.getAllNewItemsCounts($1, tenantId)'],
    [/storage\.getRecentActivities\(([^,)]*)\)/, 'storage.getRecentActivities(tenantId, $1)'],
    [/storage\.getEventRsvps\(([^,)]+)\)/, 'storage.getEventRsvps($1, tenantId)'],
    [/storage\.markQuestionAsRead\(([^,)]+)\)/, 'storage.markQuestionAsRead($1, tenantId)'],
    [/storage\.updateOrganizationSettings\(([^,)]+)\)/, 'storage.updateOrganizationSettings(tenantId, $1)'],
    [/storage\.updatePointsSettings\(([^,)]+)\)/, 'storage.updatePointsSettings(tenantId, $1)'],
    [/storage\.checkBadgeEligibility\(([^,)]+)\)/, 'storage.checkBadgeEligibility($1, tenantId)'],
    [/storage\.getProjectWithDetails\(([^,)]+)\)/, 'storage.getProjectWithDetails($1, tenantId)'],
    [/storage\.updateAnnouncementFeed\(([^,)]+)\)/, 'storage.updateAnnouncementFeed($1, tenantId)'],
    [/storage\.updateUserPoints\(([^,]+),\s*([^,)]+)\)/, 'storage.updateUserPoints($1, tenantId, $2)'],
    [/storage\.deleteContributionWithLogs\(([^,)]+)\)/, 'storage.deleteContributionWithLogs($1, tenantId)'],
  ];
  
  for (const [pattern, replacement] of patterns) {
    if (pattern.test(updated) && !updated.includes(', tenantId')) {
      updated = updated.replace(pattern, replacement);
      break;
    }
  }
  
  return updated;
}

const inputFile = 'server/routes.ts';
const outputFile = 'server/routes.ts';

console.log(`Processing ${inputFile}...`);
const result = processRoutesFile(inputFile);

fs.writeFileSync(outputFile, result, 'utf-8');

console.log(`✓ Updated ${outputFile}`);
console.log('Please review the changes and test the application.');
