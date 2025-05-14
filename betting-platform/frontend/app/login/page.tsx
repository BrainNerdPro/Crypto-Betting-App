"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"
import { useEffect } from "react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const isStrongPassword = (pwd: string) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(pwd)

  const getPasswordStrength = (pwd: string) => {
    let strength = 0
    if (pwd.length >= 8) strength++
    if (/[A-Z]/.test(pwd)) strength++
    if (/[a-z]/.test(pwd)) strength++
    if (/\d/.test(pwd)) strength++
    if (/[\W_]/.test(pwd)) strength++
    return strength
  } 
  
  useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("balance");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim() || !isStrongPassword(password)) {
      alert("Password must be strong (8+ chars, uppercase, lowercase, number, symbol)")
      return
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      if (!res.ok) throw new Error("Login failed")

      const data = await res.json()
      console.log("DEBUG: Login response", res.status, data); // <-- ADD THIS
      
      localStorage.setItem("token", data.token)
      localStorage.setItem("username", data.username)
      localStorage.setItem("balance", data.balance)

      if (data.isAdmin) {
        router.push("/admin")
      } else {
        router.push("/home")
      }
    } catch (err) {
      //alert("Login failed. Check backend.")
      setErrorMsg("Login failed. Please try again.");
      console.error(err)
    }
  }

  const strength = getPasswordStrength(password)
  const strengthColors = [
    "",
    "bg-red-500",
    "bg-orange-400",
    "bg-yellow-400",
    "bg-green-400",
    "bg-green-600",
  ]
  const strengthLabel = ["", "Very Weak", "Weak", "Fair", "Strong", "Very Strong"]

  return (  
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-semibold text-center mb-6">
          Welcome
        </h1>
        {errorMsg && (
          <p className="text-sm text-red-600 text-center mb-3">{errorMsg}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-black focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-black focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-600 hover:text-gray-800"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5 pointer-events-none" />
                ) : (
                  <EyeIcon className="w-5 h-5 pointer-events-none" />
                )}
              </button>
            </div>

            {password && (
              <div className="mt-2">
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div
                    className={`h-full ${strengthColors[strength]} rounded-full transition-all`}
                    style={{ width: `${(strength / 5) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Strength: <span className="font-medium">{strengthLabel[strength]}</span>
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-black text-white font-medium rounded-md shadow hover:bg-gray-800 transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  )
}
