'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import io from 'socket.io-client'
import { UserIcon, CurrencyDollarIcon, ClockIcon, ChartBarIcon, InboxIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'

const socket = io(`${process.env.NEXT_PUBLIC_BACKEND_URL}`)

interface DailyLine {
  question: string
  yes_odds: string
  no_odds: string
  cutoff_time: string
  is_active: boolean
  winning_side?: 'YES' | 'NO' | null
}

let countdownInterval: ReturnType<typeof setInterval> | null = null;

export default function HomePage() {
  const [username, setUsername] = useState('')
  const [balance, setBalance] = useState(0)
  const [wager, setWager] = useState('')
  const [dailyLine, setDailyLine] = useState<DailyLine | null>(null)
  const [timeRemaining, setTimeRemaining] = useState('')
  const [oddsFormat, setOddsFormat] = useState<"american" | "decimal">("american")
  const [volume, setVolume] = useState({ total_bets: 0, total_amount: 0 })
  const [isClosed, setIsClosed] = useState(false)
  const [justClosed, setJustClosed] = useState(false)
  
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('balance');
    router.push('/login');
  };
  
  const startCountdown = (cutoffISO: string) => {
    if (countdownInterval) {
      clearInterval(countdownInterval)
      countdownInterval = null
    }

    const cutoff = new Date(cutoffISO).getTime()
    countdownInterval = setInterval(() => {
      const now = Date.now()
      const remaining = cutoff - now

      if (remaining <= 0) {
        clearInterval(countdownInterval!)
        setTimeRemaining('0:00:00')
        setIsClosed(true)
        setJustClosed(true)
        setTimeout(() => setJustClosed(false), 1500)
        return
      }

      const hours = Math.floor(remaining / 3600000)
      const minutes = Math.floor((remaining % 3600000) / 60000)
      const seconds = Math.floor((remaining % 60000) / 1000)
      setTimeRemaining(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
      setIsClosed(false)
    }, 1000)
  }

  useEffect(() => {
    const storedUsername = localStorage.getItem('username')
    const storedBalance = localStorage.getItem('balance')

    if (!storedUsername) {
      router.push('/login')
      return
    }

    setUsername(storedUsername)
    if (storedBalance) setBalance(parseFloat(storedBalance))

    socket.emit('register_username', storedUsername)

    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/balance/${storedUsername}`)
      .then(res => res.json())
      .then(data => {
        if (data?.balance !== undefined) {
          setBalance(data.balance)
          localStorage.setItem("balance", data.balance.toString())
        }
      })
      .catch(() => console.warn("⚠️ Failed to fetch balance"))

    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/daily-line`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setDailyLine(data)
          startCountdown(data.cutoff_time)
        }
      })

    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/bet-volume`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setVolume(data)
        }
      })
      .catch(err => console.error("❌ Failed to fetch volume:", err))

    socket.on('daily_line_updated', (line: DailyLine) => {
      setDailyLine(line)
      startCountdown(line.cutoff_time)
    })

    socket.on('daily_line_resolved', () => {
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/daily-line`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setDailyLine(data)
            startCountdown(data.cutoff_time)
          }
        })
    })

    socket.on('connect', () => {
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/daily-line`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setDailyLine(data)
            startCountdown(data.cutoff_time)
          }
        })
    })

    socket.on('bet_volume_updated', (data) => {
      if (!data.error) {
        setVolume(data)
      }
    })

    socket.on('balance_updated', (data) => {
      if (data?.balance !== undefined) {
        setBalance(data.balance)
        localStorage.setItem('balance', data.balance.toString())
      }
    })

    return () => {
      socket.off('daily_line_updated')
      socket.off('daily_line_resolved')
      socket.off('bet_volume_updated')
      socket.off('balance_updated')
      socket.off('connect')
      if (countdownInterval) clearInterval(countdownInterval)
    }
  }, [router])

  const placeBet = async (side: 'YES' | 'NO') => {
    const amount = parseFloat(wager)
    if (isNaN(amount) || amount <= 0 || amount > balance) {
      alert('Invalid wager')
      return
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/place-bet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, choice: side, amount })
    })

    const data = await res.json()
    if (res.ok) {
      alert('Bet placed')
      setBalance(data.balance)
      localStorage.setItem('balance', data.balance.toString())
      setWager('')
    } else {
      alert(data.error || 'Bet failed')
    }
  }

  const convertOdds = (americanOdds: number): string => {
    if (isNaN(americanOdds)) return "0.00"
    const decimal = americanOdds > 0
      ? (americanOdds / 100 + 1)
      : (100 / Math.abs(americanOdds) + 1)
    return decimal.toFixed(2)
  }

  if (!dailyLine) {
    return (
      <div className="max-w-lg mx-auto mt-10 p-6 bg-white border border-gray-200 rounded-xl shadow-sm text-center space-y-6">
        <div className="flex justify-end items-center gap-4 mb-6 text-sm text-gray-700">
          <div className="flex items-center gap-1">
            <UserIcon className="w-5 h-5 text-gray-600" />
            <span className="font-medium">{username}</span>
          </div>
          <div className="flex items-center gap-1">
            <CurrencyDollarIcon className="w-5 h-5 text-gray-600" />
            <span className="font-medium">{balance} ETH</span>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="flex items-center gap-1 text-gray-500 hover:text-gray-600 transition"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

        <div className="flex justify-center items-center gap-2 text-gray-500 text-lg">
          <InboxIcon className="w-6 h-6 text-gray-400" />
          <span>No Line Yet</span>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => router.push('/deposit')}
            className="px-5 py-2 rounded border border-gray-300 text-sm hover:bg-gray-100 transition"
          >
            Deposit
          </button>
          <button
            onClick={() => router.push('/withdraw')}
            className="px-5 py-2 rounded border border-gray-300 text-sm hover:bg-gray-100 transition"
          >
            Withdraw
          </button>
        </div>
      </div>

    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex justify-end items-center gap-4 mb-6 text-sm text-gray-700">
        <div className="flex items-center gap-1">
          <UserIcon className="w-5 h-5 text-gray-600" />
          <span className="font-medium">{username}</span>
        </div>
        <div className="flex items-center gap-1">
          <CurrencyDollarIcon className="w-5 h-5 text-gray-600" />
          <span className="font-medium">{balance} ETH</span>
        </div>
        <button
          onClick={handleLogout}
          title="Logout"
          className="flex items-center gap-1 text-gray-500 hover:text-gray-600 transition"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>


      <div className="flex items-center gap-2 mb-4">
        <label htmlFor="odds" className="text-sm font-medium text-gray-600">Odds format:</label>
        <select
          id="odds"
          value={oddsFormat}
          onChange={(e) => setOddsFormat(e.target.value as "american" | "decimal")}
          className="text-sm px-2 py-1 border border-gray-300 rounded-md focus:outline-none"
        >
          <option value="american">American</option>
          <option value="decimal">Decimal</option>
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 mb-6 space-y-4">
        <h2 className="text-xl font-bold text-center text-gray-800">{dailyLine.question}</h2>
        <p className="flex items-center justify-center gap-1 text-sm text-gray-500">
          <ClockIcon className="w-4 h-4 text-gray-400" />
          Time left: {timeRemaining}
        </p>

        {dailyLine.winning_side && (
          <p className="text-center text-green-600 font-bold text-lg">
            Result: {dailyLine.winning_side} wins!
          </p>
        )}

        {isClosed || !!dailyLine.winning_side ? (
          <div className={`text-center text-red-500 font-semibold text-lg transition-opacity duration-700 ${justClosed ? 'opacity-0 animate-fadeIn' : 'opacity-100'}`}>
            Betting is closed!
          </div>
        ) : (
          <div className="animate-fadeIn space-y-4">
            <input
              type="number"
              value={wager}
              onChange={(e) => setWager(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-center"
              placeholder="Enter bet amount"
            />
            <div className="flex gap-4">
              <button
                onClick={() => placeBet('YES')}
                className="flex-1 py-2 rounded bg-green-500 hover:bg-green-600 text-white font-semibold"
              >
                YES {oddsFormat === "american"
                  ? dailyLine.yes_odds
                  : convertOdds(parseFloat(dailyLine.yes_odds))}
              </button>
              <button
                onClick={() => placeBet('NO')}
                className="flex-1 py-2 rounded bg-red-500 hover:bg-red-600 text-white font-semibold"
              >
                NO {oddsFormat === "american"
                  ? dailyLine.no_odds
                  : convertOdds(parseFloat(dailyLine.no_odds))}
              </button>
            </div>
          </div>
        )}

  <div className="text-center mt-4 flex items-center justify-center gap-2 text-sm text-gray-600 font-medium">
    <ChartBarIcon className="w-5 h-5 text-blue-500" />
    <span>{volume.total_bets} bet(s) — {(volume.total_amount || 0).toLocaleString()} ETH</span>
  </div>
</div>


      <div className="flex justify-center gap-4 mt-6">
        <button onClick={() => router.push('/deposit')} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition">Deposit</button>
        <button onClick={() => router.push('/withdraw')} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition">Withdraw</button>
      </div>
    </div>
  )
}
