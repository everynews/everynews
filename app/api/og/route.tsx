import { ImageResponse } from 'next/og'

const google = async (font: string, text: string) => {
  const url = `https://fonts.googleapis.com/css2?family=${font}&text=${encodeURIComponent(text)}`
  const css = await (await fetch(url)).text()
  const resource = css.match(/src: url\((.+)\) format\('(opentype|truetype)'\)/)

  if (resource) {
    const response = await fetch(resource[1])
    if (response.ok) {
      return await response.arrayBuffer()
    }
  }

  throw new Error('failed to load font data')
}

const korean = async () =>
  fetch(
    new URL(
      `https://raw.githubusercontent.com/orioncactus/pretendard/main/packages/pretendard/dist/web/static/woff/Pretendard-SemiBold.woff`,
    ),
  ).then((res) => res.arrayBuffer())

const japanese = async () =>
  fetch(
    new URL(
      `https://raw.githubusercontent.com/orioncactus/pretendard/main/packages/pretendard-jp/dist/web/static/woff/PretendardJP-SemiBold.woff`,
    ),
  ).then((res) => res.arrayBuffer())

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') || ''
  const description = searchParams.get('description') || ''
  ;("Semantic Monitoring. Context Understanding. Granular Delivery. Everynews keeps up with the industry so you don't have to.")
  return new ImageResponse(
    <div tw='flex flex-col w-full items-start justify-start'>
      <div
        style={{
          backgroundImage: 'linear-gradient(45deg, #000000 0%, #000012 100%)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          wordBreak: 'keep-all',
          wordWrap: 'break-word',
        }}
      >
        <div tw='flex flex-col w-full p-24 pt-16'>
          <h2 tw='items-center text-7xl text-slate-400 text-left flex flex-row gap-20'>
            <span tw='mr-4'>
              <svg
                width='80'
                viewBox='0 0 40 40'
                role='img'
                aria-label='Everynews'
              >
                <g>
                  <polygon
                    points='24.41602 24.2041 15.26074 16.16406 15.58105 15.79785 24.73633 23.83789 24.41602 24.2041'
                    fill='#68778b'
                  />
                  <path
                    d='M37.23629,16.01768L21.72248,2.39345c-.37149-.32624-.93711-.28957-1.26335,.08192L11.56885,12.59868l3.85161,3.38248 c2.22037-2.52832,6.06995-2.77797,8.59828-.55759s2.77797,6.06996,.55759,8.59828l3.85161,3.38248 8.89028-10.1233c.32624-.37149,.28955-.93711-.08194-1.26335Z'
                    fill='#e6e6e6'
                  />
                  <path
                    d='M14.01846,21.16123c-.3451-1.78631,.10855-3.70724,1.40199-5.18007l-3.85161-3.38248L2.67858,22.72197 c-.15231,.17343-.22231,.38916-.21928,.60311l11.55917-2.16385Z'
                    fill='#5e7e66'
                  />
                  <path
                    d='M18.96793,37.82296l.6528-11.74182c-1.30137-.07991-2.58718-.57476-3.64268-1.50169l-5.46064,6.218 7.7569,6.81211c.19806,.17394,.45089,.24154,.69362,.21341Z'
                    fill='#3d547e'
                  />
                  <path
                    d='M14.01846,21.16123l-11.55917,2.16385c.00346,.24433,.10315,.48631,.30121,.66025l7.7569,6.81211 5.46064-6.218c-1.0555-.92694-1.71226-2.13807-1.95959-3.41821Z'
                    fill='#f6c864'
                  />
                  <path
                    d='M19.62073,26.08113l-.6528,11.74182c.21255-.02463,.41743-.12191,.56974-.29534l8.89027-10.12329 -3.85161-3.38248c-1.29245,1.45772-3.14882,2.17023-4.95561,2.05929Z'
                    fill='#b05258'
                  />
                  <rect
                    x='13.90612'
                    y='19.758'
                    width='12.18483'
                    height='0.48644'
                    transform='translate(-8.22792 21.80613) rotate(-48.66258)'
                    fill='#68778b'
                  />
                  <polygon
                    points='14.06348 21.39844 13.97168 20.9209 25.93359 18.604 26.02539 19.08154 14.06348 21.39844'
                    fill='#68778b'
                  />
                  <rect
                    x='13.90558'
                    y='19.75721'
                    width='12.18493'
                    height='0.48753'
                    transform='translate(-1.35574 38.54758) rotate(-85.9798)'
                    fill='#68778b'
                  />
                  <circle
                    cx='27.06467'
                    cy='11.95341'
                    r='2.19105'
                    fill='#57739a'
                  />
                </g>
                <rect width='40' height='40' fill='none' />
              </svg>
            </span>
            <span>Everynews</span>
          </h2>
          <h1 tw='text-pretty text-9xl tracking-tight text-slate-300 text-left font-black leading-tight'>
            {title}
          </h1>

          <span tw='text-7xl leading-normal text-slate-500'>{description}</span>
        </div>
        <div
          style={{
            backgroundImage:
              'linear-gradient(to bottom, transparent 0%, #000000 100%)',
            bottom: 0,
            height: '540px',
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
          data: await korean(),
          name: 'Pretendard',
          style: 'normal',
        },
        {
          data: await japanese(),
          name: 'Pretendard JP',
          style: 'normal',
        },
        {
          data: await google('Noto Sans SC', 'Everynews'),
          name: 'Noto Sans SC',
          style: 'normal',
        },
      ],
      height: 900,
      width: 1600,
    },
  )
}

