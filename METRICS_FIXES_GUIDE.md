# Quick Reference: Metrics Calculation Issues and Fixes

## 🚨 Critical Issue: `no_longer_interested` Filtering Gap

### The Problem in 30 Seconds
Both "All Time Performance" display areas are counting meetings that should be excluded:
- When an SDR marks a meeting as "no longer interested", it should NOT count toward their metrics
- **MeetingsHistory** (SDRDashboard) is still counting these meetings ❌
- **useSDRs** (ManagerDashboard) is still counting these meetings ❌  
- **Commissions** correctly excludes them ✓

### Impact
If an SDR has 100 "held" meetings but 10 are marked "no_longer_interested":
- Dashboard shows: 100
- Commissions counts: 90
- **Discrepancy: +10 inflated**

---

## 🔧 Fixes Required

### Fix 1: MeetingsHistory.tsx (SDRDashboard)
**File**: [src/pages/MeetingsHistory.tsx](src/pages/MeetingsHistory.tsx#L262)

**Current Code (Line 262)**:
```typescript
const totalHeld = icpQualifiedMeetings.filter(m => m.held_at !== null && !m.no_show).length;
```

**Fixed Code**:
```typescript
const totalHeld = icpQualifiedMeetings.filter(
  m => m.held_at !== null && !m.no_show && !(m as any).no_longer_interested
).length;
```

**Also check line 261** for totalBooked - consider if it should exclude `no_longer_interested` meetings too.

---

### Fix 2: useSDRs.ts Hook (ManagerDashboard)
**File**: [src/hooks/useSDRs.ts](src/hooks/useSDRs.ts#L232)

**Current Code (Lines 232-238)**:
```typescript
const totalHeldMeetingsAllTime = sdrMeetings.filter((meeting: any) => {
  if (!meeting.held_at || meeting.no_show) return false;
  const icpStatus = meeting.icp_status;
  const isICPDisqualified = icpStatus === 'not_qualified' || icpStatus === 'rejected' || icpStatus === 'denied';
  return !isICPDisqualified;
}).length;
```

**Fixed Code**:
```typescript
const totalHeldMeetingsAllTime = sdrMeetings.filter((meeting: any) => {
  if (!meeting.held_at || meeting.no_show || (meeting as any).no_longer_interested) return false;
  const icpStatus = meeting.icp_status;
  const isICPDisqualified = icpStatus === 'not_qualified' || icpStatus === 'rejected' || icpStatus === 'denied';
  return !isICPDisqualified;
}).length;
```

**Also check line 226** for totalMeetingsSetAllTime.

---

### Fix 3: ManagerDashboard Detail Lists (Optional but Important)
**File**: [src/pages/ManagerDashboard.tsx](src/pages/ManagerDashboard.tsx#L1088)

**Current Code**:
```typescript
const getSdrMeetingsSet = (sdrId: string) => {
  return meetings.filter(m => m.sdr_id === sdrId);
};

const getSdrMeetingsHeld = (sdrId: string) => {
  return meetings.filter(m => m.sdr_id === sdrId && m.held_at);
};
```

**Issue**: These helper functions return unfiltered meetings, which causes:
1. The expanded detail list shows more meetings than the summary number
2. Meetings are displayed without ICP filtering
3. Inconsistent view of data

**Recommendation**: Apply same filtering as the header summary:
```typescript
const getSdrMeetingsSet = (sdrId: string) => {
  return meetings.filter(m => {
    if (m.sdr_id !== sdrId) return false;
    const icpStatus = (m as any).icp_status;
    return !(icpStatus === 'not_qualified' || icpStatus === 'rejected' || icpStatus === 'denied');
  });
};

const getSdrMeetingsHeld = (sdrId: string) => {
  return meetings.filter(m => {
    if (m.sdr_id !== sdrId) return false;
    const icpStatus = (m as any).icp_status;
    if (!m.held_at || m.no_show || (m as any).no_longer_interested) return false;
    return !(icpStatus === 'not_qualified' || icpStatus === 'rejected' || icpStatus === 'denied');
  });
};
```

---

## 📋 Verification Checklist

After applying fixes, verify:

- [ ] Pull up SDRDashboard → History tab → Check "All Time Performance" numbers
- [ ] Pull up ManagerDashboard → Active SDRs → Click "Meetings Booked (Total)" and "Meetings Held (Total)"
- [ ] Expand the detail lists - verify the numbers match
- [ ] Mark a meeting as "no longer interested" and verify counts decrease
- [ ] Compare "All Time" numbers with Commissions page for the same SDR

---

## 📊 Test Case

Create a test meeting with:
- ICP Status: "qualified"
- Held At: [some date]
- No Show: unchecked
- No Longer Interested: **checked**

**Expected behavior after fixes**:
- Should NOT appear in all-time held count
- Should be visible in detail lists (but marked differently)
- Should be excluded from commissions

---

## 🔍 Related Code to Review

While fixing, review these areas for consistency:

1. **Monthly held meetings logic** (also missing `no_longer_interested` filter):
   - [MeetingsHistory.tsx:322-330](src/pages/MeetingsHistory.tsx#L322)
   - [useSDRs.ts:200-213](src/hooks/useSDRs.ts#L200)

2. **Ground truth for commissions**:
   - [Commissions.tsx:55-68](src/pages/Commissions.tsx#L55) - Has complete filtering

3. **Data structure** for `no_longer_interested`:
   - Check [ClientDashboard.tsx:62](src/pages/ClientDashboard.tsx#L62) for type definition

---

## 💾 Full Documentation
See `METRICS_CALCULATION_COMPARISON.md` for complete technical analysis with all code references.
