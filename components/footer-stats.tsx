import { db } from '@everynews/database'
import { alerts } from '@everynews/schema/alert'
import { stories } from '@everynews/schema/story'
import { users } from '@everynews/schema/user'
import { count, isNull } from 'drizzle-orm'

export const FooterStats = async () => {
  const [userCount, alertCount, storyCount] = await Promise.all([
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(alerts).where(isNull(alerts.deletedAt)),
    db
      .select({ count: count() })
      .from(stories)
      .where(isNull(stories.deletedAt)),
  ])

  return (
    <div className='text-sm text-muted-foreground flex gap-3 flex-col'>
      <span>{Number(userCount[0].count).toLocaleString()} happy users</span>
      <span>{Number(alertCount[0].count).toLocaleString()} timely alerts</span>
      <span>
        {Number(storyCount[0].count).toLocaleString()} surprising stories
      </span>
    </div>
  )
}
