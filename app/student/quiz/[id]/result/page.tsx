"use client"

import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Role, QuestionType } from "@prisma/client"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface QuestionAnswer {
  id: string
  answer: string
  isCorrect: boolean
  points: number
  question: {
    id: string
    question: string
    type: QuestionType
    options?: string[]
    correctAnswer: string
    explanation?: string
    points: number
  }
}

interface QuizResult {
  id: string
  score?: number
  totalPoints?: number
  timeSpent?: number
  completedAt: string
  quiz: {
    id: string
    title: string
    description?: string
  }
  answers: QuestionAnswer[]
}

export default function QuizResultPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const attemptId = searchParams.get('attemptId')

  const { data: result, error } = useSWR<QuizResult>(
    session?.user?.role === Role.STUDENT && attemptId 
      ? `/api/quizzes/${params.id}/result?attemptId=${attemptId}` 
      : null,
    fetcher
  )

  if (!session || session.user.role !== Role.STUDENT) {
    return (
      <div className="alert alert-error">
        <span>You don't have permission to view this page.</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>Error loading results. Please try again.</span>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  const percentage = result.totalPoints ? (result.score || 0) / result.totalPoints * 100 : 0
  const correctAnswers = result.answers.filter(a => a.isCorrect).length
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-success'
    if (percentage >= 60) return 'text-warning'
    return 'text-error'
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Results Summary */}
      <div className="card bg-base-100 shadow-xl mb-8">
        <div className="card-body text-center">
          <h1 className="text-3xl font-bold mb-4">Quiz Results</h1>
          <h2 className="text-xl mb-6">{result.quiz.title}</h2>
          
          <div className="stats stats-vertical lg:stats-horizontal shadow">
            <div className="stat">
              <div className="stat-title">Score</div>
              <div className={`stat-value ${getScoreColor(percentage)}`}>
                {percentage.toFixed(1)}%
              </div>
              <div className="stat-desc">
                {result.score || 0} out of {result.totalPoints || 0} points
              </div>
            </div>
            
            <div className="stat">
              <div className="stat-title">Correct Answers</div>
              <div className="stat-value text-primary">
                {correctAnswers}/{result.answers.length}
              </div>
              <div className="stat-desc">
                {((correctAnswers / result.answers.length) * 100).toFixed(1)}% accuracy
              </div>
            </div>
            
            {result.timeSpent && (
              <div className="stat">
                <div className="stat-title">Time Taken</div>
                <div className="stat-value text-accent">
                  {formatTime(result.timeSpent)}
                </div>
                <div className="stat-desc">
                  Completed at {new Date(result.completedAt).toLocaleTimeString()}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 justify-center mt-6">
            <Link href="/student/quizzes" className="btn btn-primary">
              Take Another Quiz
            </Link>
            <Link href="/dashboard" className="btn btn-outline">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Detailed Answers */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Review Your Answers</h2>
        
        {result.answers.map((answer, index) => (
          <div key={answer.id} className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">
                  Question {index + 1}
                </h3>
                <div className="flex items-center gap-2">
                  <div className={`badge ${answer.isCorrect ? 'badge-success' : 'badge-error'}`}>
                    {answer.isCorrect ? 'Correct' : 'Incorrect'}
                  </div>
                  <div className="badge badge-outline">
                    {answer.points}/{answer.question.points} pts
                  </div>
                </div>
              </div>
              
              <p className="mb-4">{answer.question.question}</p>
              
              {answer.question.type === QuestionType.MULTIPLE_CHOICE && answer.question.options && (
                <div className="space-y-2 mb-4">
                  {answer.question.options.map((option, optIndex) => (
                    <div 
                      key={optIndex} 
                      className={`p-2 rounded ${
                        option === answer.question.correctAnswer 
                          ? 'bg-success bg-opacity-20 border border-success' 
                          : option === answer.answer && !answer.isCorrect
                            ? 'bg-error bg-opacity-20 border border-error'
                            : 'bg-base-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {option === answer.question.correctAnswer && (
                          <span className="text-success">✓</span>
                        )}
                        {option === answer.answer && !answer.isCorrect && (
                          <span className="text-error">✗</span>
                        )}
                        <span>{option}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(answer.question.type === QuestionType.TRUE_FALSE || answer.question.type === QuestionType.SHORT_ANSWER) && (
                <div className="space-y-2 mb-4">
                  <div>
                    <span className="font-semibold">Your Answer: </span>
                    <span className={answer.isCorrect ? 'text-success' : 'text-error'}>
                      {answer.answer || 'No answer provided'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold">Correct Answer: </span>
                    <span className="text-success">{answer.question.correctAnswer}</span>
                  </div>
                </div>
              )}

              {answer.question.explanation && (
                <div className="alert alert-info">
                  <div>
                    <strong>Explanation:</strong> {answer.question.explanation}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
