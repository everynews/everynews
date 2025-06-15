import type { Story } from '@everynews/schema/story'

export const AlertPreview = ({ stories }: { stories: Story[] }) => {
  if (!stories || stories.length === 0) {
    return null
  }

  return (
    <div className='space-y-6'>
      {stories.map((story) => (
        <div key={story.id} className='space-y-2'>
          <a
            href={story.url}
            target='_blank'
            rel='noopener noreferrer'
            className='text-blue-600 no-underline hover:underline'
          >
            <h2 className='text-lg font-semibold'>{story.title}</h2>
          </a>
          {story.keyFindings && story.keyFindings.length > 0 && (
            <ul className='text-gray-700 list-disc pl-5 space-y-1'>
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
