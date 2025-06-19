'use client'

import { useEffect, useState } from 'react'

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const jokes = [
  {
    answer: "Because then it'd be a foot.",
    question: "Why can't a nose be 12 inches long?",
  },
  {
    answer: 'but then it grew on me.',
    question: 'I used to hate facial hair...',
  },
  {
    answer: 'A satisfactory.',
    question: "What do you call a factory that's just okay?",
  },
  {
    answer: 'He was outstanding in his field.',
    question: 'Why did the scarecrow win an award?',
  },
  {
    answer: 'Igloos it together.',
    question: 'How does a penguin build its house?',
  },
  {
    answer: 'That would be a big step forward.',
    question: 'My wife told me I should do lunges to stay in shape.',
  },
  {
    answer: 'Nacho cheese.',
    question: "What do you call cheese that isn't yours?",
  },
  {
    answer: "It's impossible to put down.",
    question: "I'm reading a book about anti-gravity.",
  },
  { answer: 'It was two-tired.', question: 'Why did the bicycle fall over?' },
  {
    answer: 'Ten-tickles.',
    question: 'How many tickles does it take to make an octopus laugh?',
  },
  {
    answer: "They're always up to something.",
    question: "I don't trust stairs.",
  },
  {
    answer: "Because she'll let it go.",
    question: "Why can't you give Elsa a balloon?",
  },
  {
    answer: 'Great food, no atmosphere.',
    question: 'Did you hear about the restaurant on the moon?',
  },
  {
    answer: 'Sorry, still working on it.',
    question: 'Want to hear a construction joke?',
  },
  {
    answer: 'It had too many problems.',
    question: 'Why did the math book look sad?',
  },
  {
    answer: "They don't have the guts.",
    question: "Why don't skeletons fight each other?",
  },
  {
    answer: "but you didn't like it.",
    question: "I'd tell you a joke about time travel...",
  },
  {
    answer: "I'll meet you at the corner.",
    question: 'What did one wall say to the other?',
  },
  { answer: 'You planet.', question: 'How do you organize a space party?' },
  {
    answer: 'In case he got a hole in one.',
    question: 'Why did the golfer bring two pairs of pants?',
  },
  {
    answer: 'It left its Windows open.',
    question: 'Why was the computer cold?',
  },
  { answer: 'Pop.', question: 'What kind of music do balloons hate?' },
  {
    answer: "They'd crack each other up.",
    question: "Why don't eggs tell jokes?",
  },
  {
    answer: "I'll let you know which comes first.",
    question: 'I ordered a chicken and an egg online.',
  },
  {
    answer: 'It got mugged.',
    question: 'Why did the coffee file a police report?',
  },
  {
    answer: 'All I did was take a day off.',
    question: 'I once got fired from the calendar factory.',
  },
  {
    answer: 'All the fans left.',
    question: 'Why did the stadium get hot after the game?',
  },
  {
    answer: 'A waist of time.',
    question: 'What do you call a belt made of watches?',
  },
  {
    answer: "Now it's exhausted.",
    question: 'I told my car it was getting old.',
  },
  {
    answer: "Because they're shellfish.",
    question: "Why don't crabs give to charity?",
  },
  {
    answer: 'They work on many levels.',
    question: 'Why are elevator jokes so good?',
  },
  {
    answer: 'All it was doing was collecting dust.',
    question: 'I sold my vacuum yesterday.',
  },
  {
    answer: 'The professor kept going off on a tangent.',
    question: 'Why was the math lecture so long?',
  },
  { answer: 'I see food and I eat it.', question: "I'm on a seafood diet." },
  {
    answer: "Because if they flew over the bay, they'd be bagels.",
    question: 'Why do seagulls fly over the sea?',
  },
  {
    answer: 'But now I use my hands.',
    question: 'I used to play piano by ear.',
  },
  { answer: 'A carrot.', question: "What's orange and sounds like a parrot?" },
  {
    answer: "It's fine, he woke up.",
    question: 'Did you hear about the kidnapping at school?',
  },
  {
    answer: 'But I think I may have grater problems.',
    question: 'I cut my finger chopping cheese.',
  },
  {
    answer: 'It saw the salad dressing.',
    question: 'Why did the tomato blush?',
  },
  { answer: "But I'm clean now.", question: 'I used to be addicted to soap.' },
  {
    answer: 'You boil the hell out of it.',
    question: 'How do you make holy water?',
  },
  {
    answer: "It's making headlines.",
    question: 'Have you heard about the corduroy pillow?',
  },
  { answer: 'A stick.', question: "What's brown and sticky?" },
  { answer: 'Eclipse it.', question: 'How does the moon cut his hair?' },
  {
    answer: 'then it dawned on me.',
    question: 'I stayed up all night wondering where the sun went...',
  },
  {
    answer: 'It felt crummy.',
    question: 'Why did the cookie go to the doctor?',
  },
  {
    answer: 'Look for fresh prints.',
    question: 'How do you find Will Smith in the snow?',
  },
  {
    answer: 'Tyrannosaurus Wrecks.',
    question: 'What do you call a dinosaur that crashes his car?',
  },
  {
    answer: 'They say he made a mint.',
    question: 'Did you hear about the guy who invented Lifesavers?',
  },
]

export const DadJokes = () => {
  const [shuffledJokes] = useState(() => shuffleArray(jokes))
  const [currentJokeIndex, setCurrentJokeIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [, setTimeRemaining] = useState(10)

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setCurrentJokeIndex((index) => (index + 1) % shuffledJokes.length)
          setShowAnswer(false)
          return 10
        }
        if (prev === 6 && !showAnswer) {
          setShowAnswer(true)
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [showAnswer, shuffledJokes.length])

  const currentJoke = shuffledJokes[currentJokeIndex]

  return (
    <div className='flex flex-col gap-2 text-center'>
      <p className='text-base font-medium'>{currentJoke.question}</p>

      {showAnswer && (
        <p className='text-base text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-500'>
          {currentJoke.answer}
        </p>
      )}
    </div>
  )
}
