import { RiMoreFill } from '@remixicon/react'
import Image from 'next/image'
import { Button } from '~/components/ui/button'
export default function Participants() {
  return (
    <div className="flex -space-x-[0.45rem]">
      <Image
        className="ring-background rounded-full ring-1"
        src="https://res.cloudinary.com/dlzlfasou/image/upload/v1738342643/avatar-40-16_zn3ygb.jpg"
        width={24}
        height={24}
        alt="Avatar 01"
      />
      <Image
        className="ring-background rounded-full ring-1"
        src="https://res.cloudinary.com/dlzlfasou/image/upload/v1738342643/avatar-40-10_qyybkj.jpg"
        width={24}
        height={24}
        alt="Avatar 02"
      />
      <Image
        className="ring-background rounded-full ring-1"
        src="https://res.cloudinary.com/dlzlfasou/image/upload/v1738342643/avatar-40-15_fguzbs.jpg"
        width={24}
        height={24}
        alt="Avatar 03"
      />
      <Image
        className="ring-background rounded-full ring-1"
        src="https://res.cloudinary.com/dlzlfasou/image/upload/v1738342644/avatar-40-11_jtjhsp.jpg"
        width={24}
        height={24}
        alt="Avatar 04"
      />
      <Button
        variant="outline"
        className="ring-background text-muted-foreground/80 dark:bg-background dark:hover:bg-background flex size-6 items-center justify-center rounded-full border-transparent text-xs shadow-none ring-1 dark:border-transparent"
        size="icon"
      >
        <RiMoreFill className="size-4" size={16} />
      </Button>
    </div>
  )
}
