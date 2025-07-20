import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { db } from '@everynews/database'
import { stories } from '@everynews/schema'
import { and, eq, isNull } from 'drizzle-orm'
import { ImageResponse } from 'next/og'

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id') ?? ''
  const post = await db.query.stories.findFirst({
    where: and(eq(stories.id, id), isNull(stories.deletedAt)),
  })
  const title =
    searchParams.get('title') ?? (id && post?.title) ?? '"bro did u see this"'
  const description =
    searchParams.get('description') ??
    (id && Array.isArray(post?.keyFindings) && post.keyFindings.length > 0
      ? post.keyFindings.join(' ')
      : '') ??
    'You have that one bro sending the most urgent news. Everynews is one of them.'
  const [fonts, logoData] = await Promise.all([
    Promise.all([
      fs.readFile(join(process.cwd(), 'public/fonts/Pretendard-SemiBold.woff')),
      fs.readFile(
        join(process.cwd(), 'public/fonts/PretendardJP-SemiBold.woff'),
      ),
    ]).then(([kr, jp]) => [
      { data: kr, name: 'Pretendard', style: 'normal' },
      { data: jp, name: 'Pretendard JP', style: 'normal' },
    ]),
    fs.readFile(join(process.cwd(), 'public/logo.png')),
  ])

  const logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`

  const image = new ImageResponse(
    <div tw='flex flex-col w-full items-start justify-start'>
      <div
        style={{
          backgroundImage: 'linear-gradient(45deg, #121212 0%, #242424 100%)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          wordBreak: 'keep-all',
          wordWrap: 'break-word',
        }}
      >
        <div tw='flex flex-col w-full p-24 pt-16'>
          <h2 tw='items-center text-7xl text-slate-300 text-left flex flex-row'>
            {/* biome-ignore lint/performance/noImgElement: ImageResponse requires img element for OG image generation */}
            <img
              src={logoBase64}
              width='80'
              height='80'
              alt='Everynews'
              tw='mr-4'
            />
            <span>Everynews</span>
          </h2>

          <h1 tw='text-9xl tracking-tight text-slate-50 text-left font-black leading-tight'>
            {title}
          </h1>

          <span tw='text-6xl leading-normal text-slate-400'>{description}</span>
        </div>

        <div
          style={{
            backgroundImage:
              'linear-gradient(to bottom, transparent 0%, #000000 100%)',
            bottom: 0,
            height: '320px',
            left: 0,
            pointerEvents: 'none',
            position: 'absolute',
            right: 0,
          }}
        />
      </div>
    </div>,
    {
      fonts: [
        {
          data: fonts[0].data,
          name: 'Pretendard',
          style: 'normal',
        },
        {
          data: fonts[1].data,
          name: 'Pretendard JP',
          style: 'normal',
        },
      ],
      height: 1080,
      width: 1920,
    },
  )

  image.headers.set('Cache-Control', 'public, max-age=31536000, immutable')

  return image
}
