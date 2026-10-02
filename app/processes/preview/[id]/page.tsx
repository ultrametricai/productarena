import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import SharedProcessPreview from '@/components/shared-processes/SharedProcessPreview'
import { findSharedRecord, readSharedCatalog, sharedPreviewHref } from '@/lib/shared-processes/reader'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const record = findSharedRecord(readSharedCatalog(), id)
  return { title: `${record?.title ?? 'Process not found'} — Preview — Ultrametric`, robots: { index: false, follow: false } }
}

export default async function SharedPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const records = readSharedCatalog()
  const record = findSharedRecord(records, id)
  if (!record) notFound()
  const href = sharedPreviewHref(record.id, records)
  if (href !== `/processes/preview/${encodeURIComponent(id)}`) permanentRedirect(href)
  return <SharedProcessPreview id={record.id} />
}
