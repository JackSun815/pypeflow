# Detailed Comparison: "All Time Performance" Metrics Calculation

## Executive Summary
**CRITICAL DISCREPANCY FOUND**: The `no_longer_interested` flag is being **inconsistently** handled across the codebase:
- **useSDRs hook** (ManagerDashboard): Does NOT filter out `no_longer_interested` meetings for all-time totals
- **MeetingsHistory component** (SDRDashboard): Does NOT filter out `no_longer_interested` meetings for all-time totals
- **Commissions page**: DOES filter out `no_longer_interested` meetings

This inconsistency can cause the all-time performance numbers to be **higher than they should be** compared to what the commission system expects.

---

## Component 1: SDRDashboard MeetingsHistory - All Time Performance

### File Reference
[src/pages/MeetingsHistory.tsx](src/pages/MeetingsHistory.tsx#L253)

### Calculation Method
```typescript
// Lines 253-276
const calculateAllTimeStats = (): MeetingStats => {
  // Filter out non-ICP-qualified meetings
  const icpQualifiedMeetings = meetings.filter(m => {
    const icpStatus = (m as any).icp_status;
    return icpStatus !== 'not_qualified' && icpStatus !== 'rejected' && icpStatus !== 'denied';
  });
  
  const totalBooked = icpQualifiedMeetings.length;
  const totalHeld = icpQualifiedMeetings.filter(m => m.held_at !== null && !m.no_show).length;
  const totalNoShow = icpQualifiedMeetings.filter(m => m.no_show).length;
  const totalPending = icpQualifiedMeetings.filter(m => m.status === 'pending' && !m.no_show && !m.held_at).length;
  
  // Calculate rates
  const heldAndNoShow = totalHeld + totalNoShow;
  const showRate = heldAndNoShow > 0 ? (totalHeld / heldAndNoShow) * 100 : 0;
  const noShowRate = heldAndNoShow > 0 ? (totalNoShow / heldAndNoShow) * 100 : 0;

  return {
    totalBooked,
    totalHeld,
    totalNoShow,
    totalPending,
    showRate,
    noShowRate,
    percentToGoal: 0
  };
};
```

### Filtering Logic for All-Time Metrics

| Metric | Calculation | Filters Applied |
|--------|-------------|-----------------|
| **Total Meetings Booked (All Time)** | All ICP-qualified meetings passed to component | ✓ Excludes ICP disqualified (not_qualified, rejected, denied)<br/>✗ Does NOT exclude `no_longer_interested`<br/>✗ Does NOT exclude `no_show` |
| **Total Meetings Held (All Time)** | ICP-qualified meetings with `held_at !== null && !no_show` | ✓ Excludes ICP disqualified<br/>✓ Excludes meetings with `no_show=true`<br/>✗ Does NOT exclude `no_longer_interested` |

### Key Observations
1. **Data Source**: `meetings` prop passed from [SDRDashboard.tsx](src/pages/SDRDashboard.tsx#L299), which comes from `useMeetings(sdrId, supabasePublic)`
2. **Meetings are fetched without filtering** - the hook retrieves ALL meetings for the SDR from database
3. **The calculateAllTimeStats() has NO special consideration** for the `no_longer_interested` flag
4. **Helper function `getMeetingStatus()` (line 367)** does check `no_longer_interested` for categorization, but this is only used for monthly filtering, not all-time stats

---

## Component 2: ManagerDashboard Active SDRs Modal - Metrics from useSDRs Hook

### File References
- Hook: [src/hooks/useSDRs.ts](src/hooks/useSDRs.ts#L226-L238)
- Display: [src/pages/ManagerDashboard.tsx](src/pages/ManagerDashboard.tsx#L3735-L3744)

### Calculation Method in useSDRs Hook
```typescript
// Lines 226-238 in useSDRs.ts
const totalMeetingsSetAllTime = sdrMeetings.filter((meeting: any) => {
  const icpStatus = meeting.icp_status;
  const isICPDisqualified = icpStatus === 'not_qualified' || icpStatus === 'rejected' || icpStatus === 'denied';
  return !isICPDisqualified;
}).length;

const totalHeldMeetingsAllTime = sdrMeetings.filter((meeting: any) => {
  if (!meeting.held_at || meeting.no_show) return false;
  const icpStatus = meeting.icp_status;
  const isICPDisqualified = icpStatus === 'not_qualified' || icpStatus === 'rejected' || icpStatus === 'denied';
  return !isICPDisqualified;
}).length;
```

### Display in ManagerDashboard
```typescript
// Lines 3735-3744 in ManagerDashboard.tsx
<div>
  <p>Meetings Booked (Total)</p>
  <p>{sdr.totalMeetingsSetAllTime || 0}</p>
</div>

<div>
  <p>Meetings Held (Total)</p>
  <p>{sdr.totalHeldMeetingsAllTime || 0}</p>
</div>
```

### Filtering Logic for All-Time Metrics

| Metric | Calculation | Filters Applied |
|--------|-------------|-----------------|
| **totalMeetingsSetAllTime** | Count all sdrMeetings except ICP disqualified | ✓ Excludes ICP disqualified (not_qualified, rejected, denied)<br/>✗ Does NOT exclude `no_longer_interested`<br/>✗ Does NOT exclude `no_show` |
| **totalHeldMeetingsAllTime** | Count sdrMeetings with `held_at && !no_show` except ICP disqualified | ✓ Excludes ICP disqualified<br/>✓ Excludes meetings with `no_show=true`<br/>✗ Does NOT exclude `no_longer_interested` |

### Key Observations
1. **Data Source**: `sdrMeetings` is pre-filtered by SDR ID from the main meetings fetch (line 211)
   ```typescript
   const sdrMeetings = allMeetings?.filter(
     (meeting: any) => meeting.sdr_id === sdr.id
   ) || [];
   ```
2. **These metrics are returned and displayed** in the Active SDRs Modal on line 3735-3744
3. **Double-counting risk**: When expanded (line 3753-3790), the detail view uses `getSdrMeetingsSet()` which has even less filtering

---

## Critical Discrepancy: The `no_longer_interested` Flag

### Where `no_longer_interested` IS Being Filtered

#### Commissions.tsx (Line 56-57)
```typescript
const heldMeetings = meetings.filter(m => {
  // Must be actually held and not a no-show, and NOT no_longer_interested ✓
  if (!m.held_at || m.no_show || (m as any).no_longer_interested) return false;
  
  // ... other filters ...
  return isInMonth && !isICPDisqualified;
}).length;
```

**Impact**: Commission calculations EXCLUDE meetings marked as `no_longer_interested`

#### SDRDashboard.tsx Pending Meetings (Line 369)
```typescript
const upcomingPending = allMeetings.filter(
  meeting => meeting.status === 'pending' && !meeting.no_show && !meeting.no_longer_interested && ...
);
```

#### ClientDashboard.tsx Held Meetings (Line 1507)
```typescript
const baseHeldMeetingsHistory = baseCompletedMeetings.filter(
  meeting => !!meeting.held_at && !meeting.no_show && !meeting.no_longer_interested
);
```

### Where `no_longer_interested` IS NOT Being Filtered

#### useSDRs.ts - totalHeldMeetingsAllTime (Line 232-238)
- ✗ Does NOT check `no_longer_interested`
- Only checks: `held_at`, `no_show`, and ICP status

#### MeetingsHistory.tsx - calculateAllTimeStats() (Line 262)
- ✗ Does NOT check `no_longer_interested`
- Only checks: held_at and no_show

#### ManagerDashboard.tsx - getSdrMeetingsHeld() (Line 1093-1095)
```typescript
const getSdrMeetingsHeld = (sdrId: string) => {
  return meetings.filter(m => m.sdr_id === sdrId && m.held_at);
};
```
- ✗ No ICP filtering
- ✗ No `no_show` filtering
- ✗ No `no_longer_interested` filtering
- This is used for the expanded detail list when clicking "Show All"

---

## Detailed Calculation Comparison

### Scenario: An SDR with the following meetings
- Meeting A: ICP-qualified, held_at set, no_show=false, **no_longer_interested=false** → Should count ✓
- Meeting B: ICP-qualified, held_at set, no_show=false, **no_longer_interested=true** → Should NOT count? ✗
- Meeting C: not_qualified ICP, held_at set, no_show=false → Should NOT count ✓
- Meeting D: ICP-qualified, held_at=null, no_show=false → Should NOT count (not held) ✓
- Meeting E: ICP-qualified, held_at set, no_show=true → Should NOT count ✓

### Expected Count (Based on Commissions Logic)
- **Total Booked**: 3 meetings (A, B - ICP qualified; C is excluded but shouldn't be booked anyway)
- **Total Held**: 1 meeting (only A - B is marked as no_longer_interested)

### Actual Count from MeetingsHistory
- **Total Booked**: 3 meetings (A, B - ICP qualified)
- **Total Held**: 2 meetings (A and B - both have held_at and !no_show)

### Actual Count from useSDRs (ManagerDashboard)
- **Total Booked**: 3 meetings (A, B - ICP qualified)
- **Total Held**: 2 meetings (A and B - both have held_at and !no_show)

### Result: Difference of 1 Meeting
Both MeetingsHistory and useSDRs are **overcounting** by 1 held meeting when compared to the Commissions logic.

---

## Additional Filtering Inconsistency: Detail View

### ManagerDashboard Expandable Detail Lists
When user clicks on "All Meetings Booked" or "All Meetings Held" in the Active SDRs Modal:

```typescript
// Line 1088-1095
const getSdrMeetingsSet = (sdrId: string) => {
  return meetings.filter(m => m.sdr_id === sdrId);  // NO FILTERING!
};

const getSdrMeetingsHeld = (sdrId: string) => {
  return meetings.filter(m => m.sdr_id === sdrId && m.held_at);  // Only held_at check
};
```

**Problem**: The detail lists show meetings that are NOT included in the top-line numbers!
- The number shows `totalMeetingsSetAllTime` (ICP filtered)
- But the expanded list shows ALL meetings for that SDR (no ICP filtering)
- Similarly for held meetings (doesn't filter out no_longer_interested or no_show)

---

## Monthly Held Meetings Logic (For Reference)

### MeetingsHistory.tsx Monthly Calculation (Lines 322-330)
```typescript
const monthMeetingsHeld = meetings.filter(meeting => {
  const isInMonth = meeting.scheduled_date.startsWith(selectedMonth);
  const isHeld = meeting.held_at !== null && !meeting.no_show;
  const icpStatus = (m as any).icp_status;
  const isICPDisqualified = icpStatus === 'not_qualified' || icpStatus === 'rejected' || icpStatus === 'denied';
  return isInMonth && isHeld && !isICPDisqualified;
});
```

### useSDRs.ts Monthly Held Calculation (Lines 200-213)
```typescript
const sdrMeetingsHeld = sdrMeetings.filter((meeting: any) => {
  if (!meeting.held_at || meeting.no_show) return false;
  const scheduledDate = new Date(meeting.scheduled_date);
  const isInMonth = scheduledDate >= monthStart && scheduledDate < monthEnd;
  const icpStatus = meeting.icp_status;
  const isICPDisqualified = icpStatus === 'not_qualified' || icpStatus === 'rejected' || icpStatus === 'denied';
  return isInMonth && !isICPDisqualified;
});
```

**Both monthly calculations ALSO don't filter `no_longer_interested`**

---

## Summary of Issues

### Issue 1: No `no_longer_interested` Filtering in All-Time Metrics ⚠️ HIGH PRIORITY
- **Affected Components**: MeetingsHistory (SDRDashboard), useSDRs (ManagerDashboard)
- **Impact**: Shows inflated numbers for "All Time Performance"
- **Expected Fix**: Add filter to both calculations: `&& !(meeting as any).no_longer_interested`

### Issue 2: No `no_show` Filtering in Set/Booked Metrics ⚠️ MEDIUM PRIORITY
- **Affected Components**: Both MeetingsHistory and useSDRs
- **Impact**: Counts no-show meetings as "booked" meetings
- **Note**: This appears intentional (shows original bookings regardless of outcome)

### Issue 3: Mismatch Between Summary Numbers and Expanded Detail Lists ⚠️ MEDIUM PRIORITY
- **Location**: ManagerDashboard Active SDRs Modal
- **Problem**: 
  - Summary shows ICP-filtered, no_longer_interested-excluding numbers
  - Expanded details show raw meetings without filtering
  - Users see different counts when expanding
- **Solution**: Apply same filtering to getSdrMeetingsSet() and getSdrMeetingsHeld()

### Issue 4: Inconsistency with Commissions Calculations ⚠️ CRITICAL
- **Impact**: All-time performance metrics don't align with what's actually counted for commissions
- **Recommendation**: Align all calculations to match Commissions.tsx logic

---

## Code References Summary

| Location | Metric | Filters | Missing Filters |
|----------|--------|---------|-----------------|
| [MeetingsHistory.tsx:262](src/pages/MeetingsHistory.tsx#L262) | totalHeld (all-time) | ICP status | `no_longer_interested` |
| [MeetingsHistory.tsx:261](src/pages/MeetingsHistory.tsx#L261) | totalBooked (all-time) | ICP status | `no_longer_interested` |
| [useSDRs.ts:226](src/hooks/useSDRs.ts#L226) | totalMeetingsSetAllTime | ICP status | `no_longer_interested` |
| [useSDRs.ts:232](src/hooks/useSDRs.ts#L232) | totalHeldMeetingsAllTime | ICP status, no_show | `no_longer_interested` |
| [ManagerDashboard.tsx:1088](src/pages/ManagerDashboard.tsx#L1088) | getSdrMeetingsSet | (none) | ICP status, `no_longer_interested`, `no_show` |
| [ManagerDashboard.tsx:1093](src/pages/ManagerDashboard.tsx#L1093) | getSdrMeetingsHeld | sdr_id only | ICP status, `no_longer_interested`, `no_show` |
| [Commissions.tsx:56](src/pages/Commissions.tsx#L56) | heldMeetings | sched_date, held_at, !no_show, !no_longer_interested, ICP status | ✓ Complete |

