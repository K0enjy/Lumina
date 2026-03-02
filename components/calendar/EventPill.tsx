'use client'

type Props = {
  title: string
  color: string
  time?: string
  allDay: boolean
  onClick: () => void
}

function EventPill({ title, color, time, allDay, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 w-full rounded-md px-1.5 py-0.5 text-xs leading-tight cursor-pointer truncate transition-opacity hover:opacity-80"
      style={{
        backgroundColor: `${color}33`,
        color: color,
      }}
      title={allDay ? title : `${time} ${title}`}
    >
      {!allDay && time && (
        <span className="font-medium shrink-0">{time}</span>
      )}
      <span className="truncate">{title}</span>
    </button>
  )
}

export { EventPill }
