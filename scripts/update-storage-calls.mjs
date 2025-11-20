#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';

function updateStorageCalls(content) {
  let updated = content;
  
  // Track which patterns we've applied
  const updates = [];
  
  // CRITICAL: Must update in correct order - most specific patterns first!
  
  // 1. Special 4+ param methods
  const updateRequestStatusPattern = /storage\.updateRequestStatus\(([^,]+),\s*(['"][\w-]+['"]|[\w.]+),\s*([^,)]+)\)/g;
  const updateRequestStatusMatches = [...updated.matchAll(updateRequestStatusPattern)];
  updated = updated.replace(updateRequestStatusPattern, (match, id, status, rest) => {
    if (match.includes('tenantId')) return match;
    updates.push(`updateRequestStatus: ${match}`);
    // Check if there are more params after status
    if (rest.includes(',')) {
      // Has reviewedById or adminNotes
      return `storage.updateRequestStatus(${id}, tenantId, ${status}, ${rest})`;
    }
    return `storage.updateRequestStatus(${id}, tenantId, ${status})`;
  });
  
  // 2. Update methods: updateXxx(id, data) -> updateXxx(id, tenantId, data)
  const updatePattern = /storage\.(update[A-Z]\w+)\(([^,]+),\s*(?!tenantId)([^)]*)\)/g;
  updated = updated.replace(updatePattern, (match, method, id, data) => {
    if (match.includes('tenantId')) return match;
    updates.push(`${method}: ${match}`);
    return `storage.${method}(${id}, tenantId, ${data})`;
  });
  
  // 3. Three-param special methods
  const threeParamPatterns = [
    [/storage\.setModerator\(([^,]+),\s*([^,]+),\s*([^,)]+)\)/g, (m, wg, user, mod) => 
      m.includes('tenantId') ? m : `storage.setModerator(${wg}, ${user}, tenantId, ${mod})`],
    [/storage\.getFamilyMembersByRelationship\(([^,]+),\s*([^,)]+)\)/g, (m, user, rel) => 
      m.includes('tenantId') ? m : `storage.getFamilyMembersByRelationship(${user}, ${rel}, tenantId)`],
    [/storage\.isUserMemberOfWorkGroup\(([^,]+),\s*([^,)]+)\)/g, (m, wg, user) => 
      m.includes('tenantId') ? m : `storage.isUserMemberOfWorkGroup(${wg}, ${user}, tenantId)`],
    [/storage\.isUserModeratorOfWorkGroup\(([^,]+),\s*([^,)]+)\)/g, (m, wg, user) => 
      m.includes('tenantId') ? m : `storage.isUserModeratorOfWorkGroup(${wg}, ${user}, tenantId)`],
    [/storage\.addMemberToWorkGroup\(([^,]+),\s*([^,)]+)\)/g, (m, wg, user) => 
      m.includes('tenantId') ? m : `storage.addMemberToWorkGroup(${wg}, ${user}, tenantId)`],
    [/storage\.removeMemberFromWorkGroup\(([^,]+),\s*([^,)]+)\)/g, (m, wg, user) => 
      m.includes('tenantId') ? m : `storage.removeMemberFromWorkGroup(${wg}, ${user}, tenantId)`],
    [/storage\.getUserEventRsvp\(([^,]+),\s*([^,)]+)\)/g, (m, event, user) => 
      m.includes('tenantId') ? m : `storage.getUserEventRsvp(${event}, ${user}, tenantId)`],
    [/storage\.markAsRead\(([^,]+),\s*([^,)]+)\)/g, (m, msg, user) => 
      m.includes('tenantId') ? m : `storage.markAsRead(${msg}, ${user}, tenantId)`],
    [/storage\.markThreadAsRead\(([^,]+),\s*([^,)]+)\)/g, (m, thread, user) => 
      m.includes('tenantId') ? m : `storage.markThreadAsRead(${thread}, ${user}, tenantId)`],
    [/storage\.getMessageThread\(([^,]+),\s*([^,)]+)\)/g, (m, thread, user) => 
      m.includes('tenantId') ? m : `storage.getMessageThread(${thread}, ${user}, tenantId)`],
    [/storage\.answerImamQuestion\(([^,]+),\s*([^,)]+)\)/g, (m, qid, answer) => 
      m.includes('tenantId') ? m : `storage.answerImamQuestion(${qid}, tenantId, ${answer})`],
    [/storage\.updateLastViewed\(([^,]+),\s*([^,)]+)\)/g, (m, user, type) => 
      m.includes('tenantId') ? m : `storage.updateLastViewed(${user}, tenantId, ${type})`],
    [/storage\.getNewItemsCount\(([^,]+),\s*([^,)]+)\)/g, (m, user, type) => 
      m.includes('tenantId') ? m : `storage.getNewItemsCount(${user}, tenantId, ${type})`],
    [/storage\.moveTaskToWorkGroup\(([^,]+),\s*([^,)]+)\)/g, (m, task, wg) => 
      m.includes('tenantId') ? m : `storage.moveTaskToWorkGroup(${task}, ${wg}, tenantId)`],
    [/storage\.getAllTasksWithWorkGroup\(([^,]+),\s*([^,)]+)\)/g, (m, user, can) => 
      m.includes('tenantId') ? m : `storage.getAllTasksWithWorkGroup(tenantId, ${user}, ${can})`],
    [/storage\.getAllWorkGroups\(([^,]+),\s*([^,)]+)\)/g, (m, user, can) => 
      m.includes('tenantId') ? m : `storage.getAllWorkGroups(tenantId, ${user}, ${can})`],
    [/storage\.updateProductPurchaseRequest\(([^,]+),\s*([^,)]+)\)/g, (m, id, status) => 
      m.includes('tenantId') ? m : `storage.updateProductPurchaseRequest(${id}, tenantId, ${status})`],
    [/storage\.updateUserPoints\(([^,]+),\s*([^,)]+)\)/g, (m, user, points) => 
      m.includes('tenantId') ? m : `storage.updateUserPoints(${user}, tenantId, ${points})`],
  ];
  
  for (const [pattern, replacer] of threeParamPatterns) {
    updated = updated.replace(pattern, replacer);
  }
  
  // 4. Delete methods: deleteXxx(id) -> deleteXxx(id, tenantId)
  const deletePattern = /storage\.(delete[A-Z]\w+)\(([^,)]+)\)/g;
  updated = updated.replace(deletePattern, (match, method, id) => {
    if (match.includes('tenantId')) return match;
    updates.push(`${method}: ${match}`);
    return `storage.${method}(${id}, tenantId)`;
  });
  
  // 5. Single-param get methods: getXxx(id) -> getXxx(id, tenantId)
  const singleGetMethods = [
    'getUser', 'getAnnouncement', 'getEvent', 'getWorkGroup', 'getTask',
    'getAccessRequest', 'getTaskComment', 'getAnnouncementFile', 
    'getFamilyRelationship', 'getImamQuestion', 'getDocument', 'getRequest',
    'getShopProduct', 'getMarketplaceItem', 'getService', 'getImportantDate',
    'getFinancialContribution', 'getBadge', 'getProject', 'getProposal',
    'getReceipt', 'getCertificateTemplate', 'getUserCertificate',
    'getMembershipApplication', 'getAkikaApplication', 'getMarriageApplication',
    'getUserByUsername', 'getUserByEmail', 'getWorkGroupMembers', 'getUserWorkGroups',
    'getTasksByWorkGroup', 'getUserAccessRequests', 'getTaskComments',
    'getAnnouncementFiles', 'getUserFamilyRelationships', 'getMessages',
    'getConversations', 'getUnreadCount', 'getUserMarketplaceItems',
    'getUserServices', 'getUserFinancialContributions', 'getUserActivityLog',
    'getUserEventAttendance', 'getUserBadges', 'getUserProjects',
    'getUserPreferences', 'getUserRequests', 'getUserCertificates',
    'getWorkGroupModerators', 'getPrayerTimeByDate', 'getUserTotalDonations',
    'getEventAttendance', 'getProjectContributions', 'getProjectProposals',
    'getEventRsvps', 'markQuestionAsRead', 'checkBadgeEligibility',
    'getProjectWithDetails', 'updateAnnouncementFeed', 'deleteContributionWithLogs'
  ];
  
  for (const method of singleGetMethods) {
    const pattern = new RegExp(`storage\\.${method}\\(([^,)]+)\\)`, 'g');
    updated = updated.replace(pattern, (match, param) => {
      if (match.includes('tenantId')) return match;
      updates.push(`${method}: ${match}`);
      return `storage.${method}(${param}, tenantId)`;
    });
  }
  
  // 6. No-param methods: getAllXxx() -> getAllXxx(tenantId)
  const noParamMethods = [
    'getAllUsers', 'getAllAnnouncements', 'getAllEvents', 'getAllAccessRequests',
    'getAllDocuments', 'getAllRequests', 'getAllShopProducts',
    'getAllMarketplaceItems', 'getAllServices', 'getAllServicesWithUsers',
    'getAllProductPurchaseRequests', 'getAllPrayerTimes', 'getAllImportantDates',
    'getAllFinancialContributions', 'getAllActivityLogs', 'getAllBadges',
    'getAllProjects', 'getAllProposals', 'getAllReceipts',
    'getAllCertificateTemplates', 'getAllUserCertificates',
    'getAllMembershipApplications', 'getAllAkikaApplications',
    'getAllMarriageApplications', 'getOrganizationSettings', 'getPointsSettings',
    'getUserCount', 'getUpcomingEventsCount', 'getActiveTasksCount',
    'getUnansweredQuestionsCount', 'getEventLocations', 'deleteAllPrayerTimes'
  ];
  
  for (const method of noParamMethods) {
    const pattern = new RegExp(`storage\\.${method}\\(\\)`, 'g');
    updated = updated.replace(pattern, (match) => {
      if (match.includes('tenantId')) return match;
      updates.push(`${method}: ${match}`);
      return `storage.${method}(tenantId)`;
    });
  }
  
  // 7. Special methods with specific signatures
  const specialPatterns = [
    [/storage\.getNewAnnouncementsCount\(([^,)]+)\)/g, (m, days) => 
      m.includes('tenantId') ? m : `storage.getNewAnnouncementsCount(tenantId, ${days})`],
    [/storage\.getPendingAccessRequestsCount\(([^,)]*)\)/g, (m, lastViewed) => 
      m.includes('tenantId') ? m : `storage.getPendingAccessRequestsCount(tenantId${lastViewed ? ', ' + lastViewed : ''})`],
    [/storage\.getAllNewItemsCounts\(([^,)]+)\)/g, (m, userId) => 
      m.includes('tenantId') ? m : `storage.getAllNewItemsCounts(${userId}, tenantId)`],
    [/storage\.getRecentActivities\(([^,)]*)\)/g, (m, limit) => 
      m.includes('tenantId') ? m : `storage.getRecentActivities(tenantId${limit ? ', ' + limit : ''})`],
    [/storage\.updateOrganizationSettings\(([^,)]+)\)/g, (m, settings) => 
      m.includes('tenantId') ? m : `storage.updateOrganizationSettings(tenantId, ${settings})`],
    [/storage\.updatePointsSettings\(([^,)]+)\)/g, (m, settings) => 
      m.includes('tenantId') ? m : `storage.updatePointsSettings(tenantId, ${settings})`],
    [/storage\.getImamQuestions\(([^,)]*)\)/g, (m, userId) => 
      m.includes('tenantId') ? m : `storage.getImamQuestions(tenantId${userId ? ', ' + userId : ''})`],
  ];
  
  for (const [pattern, replacer] of specialPatterns) {
    updated = updated.replace(pattern, replacer);
  }
  
  console.log(`Applied ${updates.length} storage call updates`);
  return updated;
}

const inputFile = 'server/routes.ts';

console.log(`Processing ${inputFile}...`);
let content = readFileSync(inputFile, 'utf-8');

content = updateStorageCalls(content);

writeFileSync(inputFile, content, 'utf-8');

console.log(`✓ Updated ${inputFile}`);
