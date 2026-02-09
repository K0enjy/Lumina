export default async function NoteEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-[var(--text)]">Note {id}</h1>
    </main>
  )
}
