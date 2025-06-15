import type { Story } from '@everynews/schema/story'
import Link from 'next/link'

export const AlertPreview = ({ stories }: { stories: Story[] }) => {
  if (!stories || stories.length === 0) {
    return null
  }

  return (
    <div className='space-y-6'>
      {stories.map((story) => (
        <div key={story.id} className='gap-2'>
          <Link
            href={`https://${story.url}`}
            target='_blank'
            rel='noopener noreferrer'
            className='text-blue-500 no-underline hover:underline'
          >
            <h2 className='text-lg font-semibold'>{story.title}</h2>
          </Link>
          {story.keyFindings && story.keyFindings.length > 0 && (
            <ul className='text-muted-foreground list-disc px-4'>
              {story.keyFindings.map((finding) => (
                <li key={finding}>{finding}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}
