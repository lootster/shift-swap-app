"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getCurrentDateSG,
  getMaxAllowedDateSG,
  validateDateRange,
} from "@/lib/dateUtils";
import {
  generateTimeOptions,
  formatTimeForDisplay,
  validateTimeRange,
} from "@/lib/timeUtils";

interface User {
  id: string;
  fullName: string;
  appleEmail: string;
}

interface Shift {
  id: string;
  date: string;
  start: string;
  end: string;
  durationHours: number;
}

type ActiveTab = "post" | "browse" | "requests";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("post");
  const [user, setUser] = useState<User | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchShifts();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/me");
      const data = await response.json();

      if (data.success) {
        setUser(data.user);
      } else {
        router.push("/");
      }
    } catch (error) {
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchShifts = async () => {
    try {
      const response = await fetch("/api/me/shifts");
      const data = await response.json();

      if (data.success) {
        setShifts(data.shifts);
      }
    } catch (error) {
      console.error("Failed to fetch shifts:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Shift Swap
              </h1>
              <p className="text-sm text-gray-600">Welcome, {user?.fullName}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: "post" as const, label: "My Shifts" },
              { id: "browse" as const, label: "Browse Swaps" },
              { id: "requests" as const, label: "My Requests" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {activeTab === "post" && (
          <PostSwapTab shifts={shifts} onShiftAdded={fetchShifts} />
        )}
        {activeTab === "browse" && <BrowseSwapsTab />}
        {activeTab === "requests" && <MyRequestsTab />}
      </main>
    </div>
  );
}

// Post Swap Tab Component
function PostSwapTab({
  shifts,
  onShiftAdded,
}: {
  shifts: Shift[];
  onShiftAdded: () => void;
}) {
  const [showAddShift, setShowAddShift] = useState(false);
  const [newShift, setNewShift] = useState({
    date: "",
    start: "",
    end: "",
    durationHours: 4,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Swap request state
  const [showSwapRequest, setShowSwapRequest] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [swapRequest, setSwapRequest] = useState({
    wantType: "SAME_DAY" as "SAME_DAY" | "DATE_LIST",
    wantDates: [] as string[],
    timeRule: "ANY" as "ANY" | "EXACT_START" | "END_NOT_AFTER",
    timeValue: "",
    note: "",
  });
  const [isSubmittingSwap, setIsSubmittingSwap] = useState(false);

  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Frontend validation for date range
    const dateValidation = validateDateRange(newShift.date);
    if (!dateValidation.isValid) {
      alert(dateValidation.error);
      setIsSubmitting(false);
      return;
    }

    // Frontend validation for time range
    const timeValidation = validateTimeRange(newShift.start, newShift.end);
    if (!timeValidation.isValid) {
      alert(timeValidation.error);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/me/shifts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newShift),
      });

      const data = await response.json();

      if (data.success) {
        setNewShift({ date: "", start: "", end: "", durationHours: 4 });
        setShowAddShift(false);
        onShiftAdded();
      } else {
        alert(data.error || "Failed to add shift");
      }
    } catch (error) {
      console.error("Failed to add shift:", error);
      alert("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostSwapRequest = (shift: Shift) => {
    setSelectedShift(shift);
    setShowSwapRequest(true);
  };

  const handleSwapRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShift) return;

    // Client-side validation
    if (
      swapRequest.wantType === "DATE_LIST" &&
      swapRequest.wantDates.length === 0
    ) {
      alert("Please add at least one date you can work instead.");
      return;
    }

    if (swapRequest.timeRule !== "ANY" && !swapRequest.timeValue) {
      alert("Please specify the time requirement.");
      return;
    }

    setIsSubmittingSwap(true);

    try {
      const requestData = {
        haveShiftId: selectedShift.id,
        wantType: swapRequest.wantType,
        timeRule: swapRequest.timeRule,
        note: swapRequest.note || undefined,
        ...(swapRequest.wantType === "DATE_LIST" && {
          wantDates: swapRequest.wantDates,
        }),
        ...(swapRequest.timeRule !== "ANY" && {
          timeValue: swapRequest.timeValue,
        }),
      };

      console.log("Sending swap request:", requestData);

      const response = await fetch("/api/swap-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (data.success) {
        setSwapRequest({
          wantType: "SAME_DAY",
          wantDates: [],
          timeRule: "ANY",
          timeValue: "",
          note: "",
        });
        setShowSwapRequest(false);
        setSelectedShift(null);
        alert("Swap request posted successfully!");
      } else {
        alert(data.error || "Failed to post swap request");
      }
    } catch (error) {
      console.error("Failed to post swap request:", error);
      alert("Network error. Please try again.");
    } finally {
      setIsSubmittingSwap(false);
    }
  };

  const addWantDate = () => {
    const dateInput = document.getElementById("wantDate") as HTMLInputElement;
    if (dateInput && !dateInput.value) {
      alert("Please select a date first.");
      return;
    }

    if (dateInput && swapRequest.wantDates.includes(dateInput.value)) {
      alert("This date has already been added.");
      return;
    }

    // Validate date range
    if (dateInput && dateInput.value) {
      const dateValidation = validateDateRange(dateInput.value);
      if (!dateValidation.isValid) {
        alert(dateValidation.error);
        return;
      }

      setSwapRequest({
        ...swapRequest,
        wantDates: [...swapRequest.wantDates, dateInput.value],
      });
      dateInput.value = "";
    }
  };

  const removeWantDate = (dateToRemove: string) => {
    setSwapRequest({
      ...swapRequest,
      wantDates: swapRequest.wantDates.filter((date) => date !== dateToRemove),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">My Shifts</h2>
        <button
          onClick={() => setShowAddShift(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
        >
          Add Shift
        </button>
      </div>

      {/* Add Shift Form */}
      {showAddShift && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Add New Shift</h3>
          <form onSubmit={handleAddShift} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date
                </label>
                <input
                  type="date"
                  required
                  min={getCurrentDateSG()}
                  max={getMaxAllowedDateSG()}
                  value={newShift.date}
                  onChange={(e) =>
                    setNewShift({ ...newShift, date: e.target.value })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Duration
                </label>
                <select
                  value={newShift.durationHours}
                  onChange={(e) =>
                    setNewShift({
                      ...newShift,
                      durationHours: Number(e.target.value),
                    })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={4}>4 hours</option>
                  <option value={9}>9 hours</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Start Time
                </label>
                <select
                  required
                  value={newShift.start}
                  onChange={(e) =>
                    setNewShift({ ...newShift, start: e.target.value })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select start time...</option>
                  {generateTimeOptions().map((time) => (
                    <option key={time} value={time}>
                      {formatTimeForDisplay(time)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  End Time
                </label>
                <select
                  required
                  value={newShift.end}
                  onChange={(e) =>
                    setNewShift({ ...newShift, end: e.target.value })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select end time...</option>
                  {generateTimeOptions().map((time) => (
                    <option key={time} value={time}>
                      {formatTimeForDisplay(time)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? "Adding..." : "Add Shift"}
              </button>
              <button
                type="button"
                onClick={() => setShowAddShift(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Swap Request Form */}
      {showSwapRequest && selectedShift && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">
            Post Swap Request for{" "}
            {new Date(selectedShift.date + "T00:00:00").toLocaleDateString(
              "en-SG",
              {
                weekday: "short",
                month: "short",
                day: "numeric",
              }
            )}{" "}
            {formatTimeForDisplay(selectedShift.start)}-
            {formatTimeForDisplay(selectedShift.end)}
          </h3>
          <form onSubmit={handleSwapRequestSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What type of swap do you want?
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="wantType"
                    value="SAME_DAY"
                    checked={swapRequest.wantType === "SAME_DAY"}
                    onChange={(e) =>
                      setSwapRequest({
                        ...swapRequest,
                        wantType: e.target.value as "SAME_DAY" | "DATE_LIST",
                      })
                    }
                    className="mr-2"
                  />
                  Same day swap (someone with a shift on the same date)
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="wantType"
                    value="DATE_LIST"
                    checked={swapRequest.wantType === "DATE_LIST"}
                    onChange={(e) =>
                      setSwapRequest({
                        ...swapRequest,
                        wantType: e.target.value as "SAME_DAY" | "DATE_LIST",
                      })
                    }
                    className="mr-2"
                  />
                  Specific dates I can work instead
                </label>
              </div>
            </div>

            {swapRequest.wantType === "DATE_LIST" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dates you can work instead
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="date"
                    id="wantDate"
                    min={getCurrentDateSG()}
                    max={getMaxAllowedDateSG()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addWantDate}
                    className="bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-300"
                  >
                    Add Date
                  </button>
                </div>
                {swapRequest.wantDates.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {swapRequest.wantDates.map((date) => (
                      <span
                        key={date}
                        className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                      >
                        {new Date(date + "T00:00:00").toLocaleDateString(
                          "en-SG",
                          {
                            month: "short",
                            day: "numeric",
                          }
                        )}
                        <button
                          type="button"
                          onClick={() => removeWantDate(date)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time requirements
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="timeRule"
                    value="ANY"
                    checked={swapRequest.timeRule === "ANY"}
                    onChange={(e) =>
                      setSwapRequest({
                        ...swapRequest,
                        timeRule: e.target.value as any,
                      })
                    }
                    className="mr-2"
                  />
                  Any time is fine
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="timeRule"
                    value="EXACT_START"
                    checked={swapRequest.timeRule === "EXACT_START"}
                    onChange={(e) =>
                      setSwapRequest({
                        ...swapRequest,
                        timeRule: e.target.value as any,
                      })
                    }
                    className="mr-2"
                  />
                  Must start at exactly this time
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="timeRule"
                    value="END_NOT_AFTER"
                    checked={swapRequest.timeRule === "END_NOT_AFTER"}
                    onChange={(e) =>
                      setSwapRequest({
                        ...swapRequest,
                        timeRule: e.target.value as any,
                      })
                    }
                    className="mr-2"
                  />
                  Must end at or before this time
                </label>
              </div>
              {swapRequest.timeRule !== "ANY" && (
                <select
                  value={swapRequest.timeValue}
                  onChange={(e) =>
                    setSwapRequest({
                      ...swapRequest,
                      timeValue: e.target.value,
                    })
                  }
                  className="mt-2 block w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select time...</option>
                  {generateTimeOptions().map((time) => (
                    <option key={time} value={time}>
                      {formatTimeForDisplay(time)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional notes (optional)
              </label>
              <textarea
                value={swapRequest.note}
                onChange={(e) =>
                  setSwapRequest({ ...swapRequest, note: e.target.value })
                }
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any additional information or preferences..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isSubmittingSwap}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmittingSwap ? "Posting..." : "Post Swap Request"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSwapRequest(false);
                  setSelectedShift(null);
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Shifts List */}
      <div className="bg-white shadow rounded-lg">
        {shifts.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No shifts added yet. Add your first shift to start swapping!
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {shifts.map((shift) => (
              <div
                key={shift.id}
                className="p-6 flex justify-between items-center"
              >
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(shift.date + "T00:00:00").toLocaleDateString(
                      "en-SG",
                      {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatTimeForDisplay(shift.start)} -{" "}
                    {formatTimeForDisplay(shift.end)} ({shift.durationHours}h)
                  </div>
                </div>
                <button
                  onClick={() => handlePostSwapRequest(shift)}
                  className="text-blue-600 text-sm font-medium hover:text-blue-700"
                >
                  Post Swap Request
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Browse Swaps Tab Component
function BrowseSwapsTab() {
  const [swapRequests, setSwapRequests] = useState<any[]>([]);
  const [myShifts, setMyShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [selectedShiftId, setSelectedShiftId] = useState("");
  const [isSubmittingInterest, setIsSubmittingInterest] = useState(false);

  useEffect(() => {
    fetchSwapRequests();
    fetchMyShifts();
  }, []);

  const fetchSwapRequests = async () => {
    try {
      const response = await fetch("/api/swap-requests");
      const data = await response.json();

      if (data.success) {
        setSwapRequests(data.swapRequests);
      }
    } catch (error) {
      console.error("Failed to fetch swap requests:", error);
    }
  };

  const fetchMyShifts = async () => {
    try {
      const response = await fetch("/api/me/shifts");
      const data = await response.json();

      if (data.success) {
        setMyShifts(data.shifts);
      }
    } catch (error) {
      console.error("Failed to fetch my shifts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowInterest = (request: any) => {
    setSelectedRequest(request);
    setShowInterestModal(true);
  };

  const handleSubmitInterest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShiftId || !selectedRequest) return;

    setIsSubmittingInterest(true);

    try {
      const response = await fetch("/api/interests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          swapRequestId: selectedRequest.id,
          offeredShiftId: selectedShiftId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Interest submitted successfully!");
        setShowInterestModal(false);
        setSelectedRequest(null);
        setSelectedShiftId("");
        fetchSwapRequests(); // Refresh to show updated interest count
      } else {
        alert(data.error || "Failed to submit interest");
      }
    } catch (error) {
      console.error("Failed to submit interest:", error);
      alert("Network error. Please try again.");
    } finally {
      setIsSubmittingInterest(false);
    }
  };

  // Filter my shifts that match the selected request's requirements
  const getEligibleShifts = (request: any) => {
    return myShifts.filter((shift) => {
      // Duration must match
      if (shift.durationHours !== request.haveShift.durationHours) return false;

      // Same day requirement
      if (
        request.wantType === "SAME_DAY" &&
        shift.date !== request.haveShift.date
      )
        return false;

      // Date list requirement
      if (request.wantType === "DATE_LIST" && request.wantDates) {
        const wantDates = JSON.parse(request.wantDates);
        if (!wantDates.includes(shift.date)) return false;
      }

      // Time requirements
      if (
        request.timeRule === "EXACT_START" &&
        shift.start !== request.timeValue
      )
        return false;
      if (request.timeRule === "END_NOT_AFTER" && shift.end > request.timeValue)
        return false;

      return true;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-lg font-medium text-gray-900">
          Browse Swap Requests
        </h2>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  // Filter requests to only show those where user has matching shifts
  const relevantRequests = swapRequests.filter((request) => {
    const eligibleShifts = getEligibleShifts(request);
    return eligibleShifts.length > 0;
  });

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-900">
        Browse Swap Requests
      </h2>

      {relevantRequests.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center text-gray-500">
            No matching swap requests available at the moment.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {relevantRequests.map((request) => {
            const eligibleShifts = getEligibleShifts(request);

            return (
              <div key={request.id} className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="font-medium text-gray-900">
                        {request.requester.fullName} wants to swap
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                        {request.haveShift.durationHours}h shift
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 space-y-1 mb-3">
                      <div>
                        <strong>Has:</strong>{" "}
                        {new Date(
                          request.haveShift.date + "T00:00:00"
                        ).toLocaleDateString("en-SG", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        {formatTimeForDisplay(request.haveShift.start)}-
                        {formatTimeForDisplay(request.haveShift.end)}
                      </div>
                      <div>
                        <strong>Wants:</strong>{" "}
                        {request.wantType === "SAME_DAY"
                          ? "Same day swap"
                          : "Specific dates"}
                        {request.wantType === "DATE_LIST" &&
                          request.wantDates && (
                            <span className="ml-2">
                              (
                              {JSON.parse(request.wantDates)
                                .map((date: string) =>
                                  new Date(
                                    date + "T00:00:00"
                                  ).toLocaleDateString("en-SG", {
                                    month: "short",
                                    day: "numeric",
                                  })
                                )
                                .join(", ")}
                              )
                            </span>
                          )}
                      </div>
                      <div>
                        <strong>Time:</strong>{" "}
                        {request.timeRule === "ANY"
                          ? "Any time"
                          : request.timeRule === "EXACT_START"
                          ? `Must start at ${formatTimeForDisplay(
                              request.timeValue
                            )}`
                          : `Must end by ${formatTimeForDisplay(
                              request.timeValue
                            )}`}
                      </div>
                      {request.note && (
                        <div>
                          <strong>Note:</strong> {request.note}
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-gray-500">
                      Posted{" "}
                      {new Date(request.createdAt).toLocaleDateString("en-SG")}{" "}
                      • {request.interests.length}{" "}
                      {request.interests.length === 1
                        ? "interest"
                        : "interests"}
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    <button
                      onClick={() => handleShowInterest(request)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                    >
                      Show Interest
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interest Modal */}
      {showInterestModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">
              Show Interest in {selectedRequest.requester.fullName}'s Request
            </h3>
            <form onSubmit={handleSubmitInterest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select your shift to offer:
                </label>
                <select
                  value={selectedShiftId}
                  onChange={(e) => setSelectedShiftId(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Choose a shift...</option>
                  {getEligibleShifts(selectedRequest).map((shift) => (
                    <option key={shift.id} value={shift.id}>
                      {new Date(shift.date + "T00:00:00").toLocaleDateString(
                        "en-SG",
                        {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        }
                      )}{" "}
                      {formatTimeForDisplay(shift.start)}-
                      {formatTimeForDisplay(shift.end)} ({shift.durationHours}h)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isSubmittingInterest}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmittingInterest ? "Submitting..." : "Submit Interest"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowInterestModal(false);
                    setSelectedRequest(null);
                    setSelectedShiftId("");
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// My Requests Tab Component
function MyRequestsTab() {
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    try {
      const response = await fetch("/api/me/swap-requests");
      const data = await response.json();

      if (data.success) {
        setMyRequests(data.swapRequests);
      }
    } catch (error) {
      console.error("Failed to fetch my requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm("Are you sure you want to delete this swap request?")) {
      return;
    }

    setDeletingId(requestId);

    try {
      const response = await fetch(`/api/swap-requests/${requestId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        // Remove the deleted request from the list
        setMyRequests(myRequests.filter((req) => req.id !== requestId));
        alert("Swap request deleted successfully!");
      } else {
        alert(data.error || "Failed to delete swap request");
      }
    } catch (error) {
      console.error("Failed to delete swap request:", error);
      alert("Network error. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-lg font-medium text-gray-900">My Swap Requests</h2>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-900">My Swap Requests</h2>
      {myRequests.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center text-gray-500">
            You haven't posted any swap requests yet.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {myRequests.map((request) => (
            <div key={request.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="font-medium text-gray-900">
                      {new Date(
                        request.haveShift.date + "T00:00:00"
                      ).toLocaleDateString("en-SG", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      {formatTimeForDisplay(request.haveShift.start)}-
                      {formatTimeForDisplay(request.haveShift.end)}
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {request.haveShift.durationHours}h shift
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 space-y-1">
                    <div>
                      <strong>Want:</strong>{" "}
                      {request.wantType === "SAME_DAY"
                        ? "Same day swap"
                        : "Specific dates"}
                      {request.wantType === "DATE_LIST" &&
                        request.wantDates && (
                          <span className="ml-2">
                            (
                            {JSON.parse(request.wantDates)
                              .map((date: string) =>
                                new Date(date + "T00:00:00").toLocaleDateString(
                                  "en-SG",
                                  { month: "short", day: "numeric" }
                                )
                              )
                              .join(", ")}
                            )
                          </span>
                        )}
                    </div>
                    <div>
                      <strong>Time:</strong>{" "}
                      {request.timeRule === "ANY"
                        ? "Any time"
                        : request.timeRule === "EXACT_START"
                        ? `Must start at ${formatTimeForDisplay(
                            request.timeValue
                          )}`
                        : `Must end by ${formatTimeForDisplay(
                            request.timeValue
                          )}`}
                    </div>
                    {request.note && (
                      <div>
                        <strong>Note:</strong> {request.note}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right space-y-2">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {request.interests.length}{" "}
                      {request.interests.length === 1
                        ? "interest"
                        : "interests"}
                    </div>
                    <div className="text-xs text-gray-500">
                      Posted{" "}
                      {new Date(request.createdAt).toLocaleDateString("en-SG")}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteRequest(request.id)}
                    disabled={deletingId === request.id}
                    className="text-red-600 text-sm font-medium hover:text-red-700 disabled:opacity-50"
                  >
                    {deletingId === request.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>

              {request.interests.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Interested People:
                  </h4>
                  <div className="space-y-2">
                    {request.interests.map((interest: any) => (
                      <div
                        key={interest.id}
                        className="flex justify-between items-center bg-gray-50 p-3 rounded"
                      >
                        <div>
                          <div className="font-medium text-sm">
                            {interest.interestedUser.fullName}
                          </div>
                          <div className="text-xs text-gray-600">
                            {interest.interestedUser.appleEmail}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">
                            {new Date(
                              interest.offeredShift.date + "T00:00:00"
                            ).toLocaleDateString("en-SG", {
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            {formatTimeForDisplay(interest.offeredShift.start)}-
                            {formatTimeForDisplay(interest.offeredShift.end)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {interest.offeredShift.durationHours}h shift
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
