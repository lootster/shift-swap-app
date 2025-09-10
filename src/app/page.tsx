"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [employeeId, setEmployeeId] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [passcode, setPasscode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [employeeIdError, setEmployeeIdError] = useState("");
  const [firstNameError, setFirstNameError] = useState("");
  const router = useRouter();

  const validateEmployeeId = (value: string) => {
    if (!/^\d{6}$/.test(value)) {
      return "Employee ID must be exactly 6 digits";
    }
    if (value === "000000") {
      return "Invalid employee ID format";
    }
    return "";
  };

  const validateFirstName = (value: string) => {
    if (value.includes(" ")) {
      return "First name cannot contain spaces";
    }
    if (value.length === 0) {
      return "First name is required";
    }
    return "";
  };

  const handleEmployeeIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmployeeId(value);
    setEmployeeIdError(validateEmployeeId(value));
  };

  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFirstName(value);
    setFirstNameError(validateFirstName(value));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validate fields before submission
    const empIdValidation = validateEmployeeId(employeeId);
    const firstNameValidation = validateFirstName(firstName);

    if (empIdValidation) {
      setEmployeeIdError(empIdValidation);
      setIsLoading(false);
      return;
    }

    if (firstNameValidation) {
      setFirstNameError(firstNameValidation);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId,
          appleEmail: email,
          fullName: firstName,
          passcode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/dashboard");
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Shift Swap</h1>
          <p className="mt-2 text-gray-600">🍎 Retail Specialists</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="employeeId"
                className="block text-sm font-medium text-gray-700"
              >
                Employee ID
              </label>
              <input
                id="employeeId"
                name="employeeId"
                type="text"
                required
                value={employeeId}
                onChange={handleEmployeeIdChange}
                maxLength={6}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  employeeIdError ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="6-digit employee ID"
              />
              {employeeIdError && (
                <p className="mt-1 text-sm text-red-600">{employeeIdError}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-gray-700"
              >
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                value={firstName}
                onChange={handleFirstNameChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  firstNameError ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Your first name only"
              />
              {firstNameError && (
                <p className="mt-1 text-sm text-red-600">{firstNameError}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Corporate Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Your corporate email address"
              />
            </div>

            <div>
              <label
                htmlFor="passcode"
                className="block text-sm font-medium text-gray-700"
              >
                Pass Code
              </label>
              <input
                id="passcode"
                name="passcode"
                type="password"
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter pass code"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
