import { redirect } from 'next/navigation'

// /rankings/processes has no ranking of its own — the group's home is the most-automatable
// view (launch audit S5: the bare URL 404'd while its five children were live).
export default function ProcessRankingsIndex() {
  redirect('/rankings/processes/most-automatable')
}
