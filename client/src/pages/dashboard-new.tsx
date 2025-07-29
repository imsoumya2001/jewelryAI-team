import React, { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import confetti from "canvas-confetti";
import {
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  MapPin,
  Clock,
  Plus,
  FileText,
  UserCheck,
  Briefcase,
  Activity,
  X,
  BarChart3,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Camera,
  Edit3
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClientWithTeam } from "@shared/schema";
import { format, subDays, isAfter, getDaysInMonth, startOfMonth, getDay } from "date-fns";
import { formatCurrency } from "@/lib/currency";
import { apiRequest } from "@/lib/queryClient";
import ClientDetailModal from "@/components/client-detail-modal-fixed";
import ClientFormModal from "@/components/client-form-modal-new";
import ClientQuickCard from "@/components/client-quick-card";

export default function Dashboard() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [currencyMode, setCurrencyMode] = useState<'USD' | 'INR'>('USD');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [imageInput, setImageInput] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dateImageInput, setDateImageInput] = useState('');
  const [checkedClients, setCheckedClients] = useState<Set<number>>(new Set());
  const [clientLastWorked, setClientLastWorked] = useState<Map<number, string>>(new Map());
  const buttonRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const [activeCalendarTab, setActiveCalendarTab] = useState<'work' | 'finances'>('work');
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [clientDetailOpen, setClientDetailOpen] = useState(false);
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<number | null>(null);
  const [contractClientsModal, setContractClientsModal] = useState<{
    open: boolean;
    clients: ClientWithTeam[];
    date: string;
  }>({ open: false, clients: [], date: '' });
  
  const queryClient = useQueryClient();

  // Utility function to format currency with USD conversion
  const formatCurrencyWithUSD = (amount: number, currency: string) => {
    const formatCurrency = (amt: number, curr: string) => {
      const symbols: { [key: string]: string } = {
        'USD': '$', 'EUR': '€', 'GBP': '£', 'INR': '₹', 'AED': 'AED', 'CAD': 'C$',
        'AUD': 'A$', 'JPY': '¥', 'CHF': 'CHF', 'CNY': '¥', 'SAR': 'SAR', 'QAR': 'QAR',
        'OMR': 'OMR', 'BHD': 'BHD', 'KWD': 'KWD'
      };
      const arabicCurrencies = ['AED', 'SAR', 'QAR', 'OMR', 'BHD', 'KWD'];
      const displaySymbol = arabicCurrencies.includes(curr) ? curr : (symbols[curr] || curr);
      return `${displaySymbol} ${Math.round(amt).toLocaleString()}`;
    };

    const convertToUSD = (amt: number, curr: string): number => {
      const rates: { [key: string]: number } = {
        'EUR': 1.10, 'GBP': 1.27, 'INR': 0.012, 'AED': 0.27, 'CAD': 0.74,
        'AUD': 0.67, 'JPY': 0.0067, 'CHF': 1.12, 'CNY': 0.14, 'SAR': 0.27,
        'QAR': 0.27, 'OMR': 2.60, 'BHD': 2.65, 'KWD': 3.25
      };
      return amt * (rates[curr] || 1);
    };

    const formatted = formatCurrency(amount, currency);
    if (currency !== 'USD') {
      const usdAmount = convertToUSD(amount, currency);
      return `${formatted} ($${Math.round(usdAmount).toLocaleString()})`;
    }
    return formatted;
  };

  // Fetch real data
  const { data: clients = [] } = useQuery<ClientWithTeam[]>({
    queryKey: ["/api/clients"],
  });

  const { data: allTransactions = [] } = useQuery<any[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: teamMembers = [] } = useQuery<any[]>({
    queryKey: ["/api/team-members"],
  });

  // Image tracking queries
  const { data: todayImageData } = useQuery({
    queryKey: ["/api/images/today"],
  });

  const { data: monthlyImageData = [] } = useQuery({
    queryKey: ["/api/images/month", currentDate.getFullYear(), currentDate.getMonth() + 1],
  });

  // Work sessions query
  const { data: todayWorkSessions = [] } = useQuery({
    queryKey: ["/api/work-sessions/today"],
  });

  // Marketing transactions query
  const { data: marketingTransactions = [] } = useQuery<any[]>({
    queryKey: ["/api/marketing-transactions"],
  });

  // Work session mutations
  const createWorkSessionMutation = useMutation({
    mutationFn: async (clientId: number) => {
      return await apiRequest("POST", `/api/work-sessions`, { clientId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-sessions/today"] });
    }
  });

  const deleteWorkSessionMutation = useMutation({
    mutationFn: async (clientId: number) => {
      return await apiRequest("DELETE", `/api/work-sessions/${clientId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-sessions/today"] });
    }
  });

  const updateImageCountMutation = useMutation({
    mutationFn: async (count: number) => {
      const response = await apiRequest("POST", "/api/images/today", { count });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/images/today"] });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/images/month", currentDate.getFullYear(), currentDate.getMonth() + 1] 
      });
    },
  });

  const updateDateImageCountMutation = useMutation({
    mutationFn: async ({ date, count }: { date: string; count: number }) => {
      const response = await apiRequest("POST", "/api/images/date", { date, count });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/images/month", currentDate.getFullYear(), currentDate.getMonth() + 1] 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/images/today"] });
    },
  });

  // Calculate real metrics - Active clients are those with "running" or "planning" status
  const activeClients = clients.filter(client => 
    client.projectStatus?.toLowerCase() === 'running' || client.projectStatus?.toLowerCase() === 'planning'
  );

  const totalRevenue = clients.reduce((sum, client) => 
    sum + parseFloat(client.amountPaidUSD?.toString() || client.amountPaid.toString()), 0
  );

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyRevenue = clients
    .filter(client => {
      const clientDate = new Date(client.createdAt);
      return clientDate.getMonth() === currentMonth && clientDate.getFullYear() === currentYear;
    })
    .reduce((sum, client) => 
      sum + parseFloat(client.amountPaidUSD?.toString() || client.amountPaid.toString()), 0
    );

  // Calculate overall project progress for active clients only
  const totalImagesRequested = activeClients.reduce((sum, client) => 
    sum + (client.totalImagesToMake || 0), 0
  );
  
  const totalImagesMade = activeClients.reduce((sum, client) => 
    sum + (client.imagesMade || 0), 0
  );
  
  const totalJewelryRequested = activeClients.reduce((sum, client) => 
    sum + (client.totalJewelryArticles || 0), 0
  );
  
  const totalJewelryMade = activeClients.reduce((sum, client) => 
    sum + (client.jewelryArticlesMade || 0), 0
  );
  
  // Combined progress calculation
  const totalWorkRequested = totalImagesRequested + totalJewelryRequested;
  const totalWorkCompleted = totalImagesMade + totalJewelryMade;
  
  const overallProgress = totalWorkRequested > 0 ? 
    Math.round((totalWorkCompleted / totalWorkRequested) * 100) : 0;

  // Currency conversion (simplified - using approximate rate)
  const convertCurrency = (amount: number) => {
    if (currencyMode === 'INR') {
      return `₹${Math.round(amount * 83).toLocaleString()}`;
    }
    return `$${Math.round(amount).toLocaleString()}`;
  };

  const toggleCurrency = () => {
    setCurrencyMode(prev => prev === 'USD' ? 'INR' : 'USD');
  };

  // Recent transactions (last 7 days) - include both manual transactions and client payments
  const sevenDaysAgo = subDays(new Date(), 7);
  
  // Combine manual transactions with client payments
  const allRecentTransactions = [
    // Manual transactions from API
    ...allTransactions
      .filter(t => t.createdAt && !isNaN(new Date(t.createdAt).getTime()))
      .map(t => ({
        id: t.id,
        type: t.category === 'Revenue' ? 'incoming' : 'outgoing',
        name: t.name || t.description || 'Transaction',
        amount: parseFloat(t.amountUSD || t.amount) || 0,
        teamMember: teamMembers.find(tm => tm.id === t.teamMemberId)?.name || null,
        date: new Date(t.createdAt),
        category: t.category,
        isManual: true
      })),
    // Client payments
    ...clients
      .filter(client => {
        const amount = parseFloat(client.amountPaidUSD?.toString() || client.amountPaid.toString());
        return amount > 0 && client.createdAt && !isNaN(new Date(client.createdAt).getTime());
      })
      .map(client => ({
        id: `client-${client.id}`,
        type: 'incoming' as const,
        name: `Payment from ${client.name}`,
        amount: parseFloat(client.amountPaidUSD?.toString() || client.amountPaid.toString()),
        teamMember: client.assignments?.[0]?.teamMember?.name || null,
        date: new Date(client.createdAt),
        category: 'Revenue',
        isManual: false
      }))
  ];
  
  const recentTransactions = allRecentTransactions
    .filter(transaction => isAfter(transaction.date, sevenDaysAgo))
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 8);

  const openModal = (modalType: string) => setActiveModal(modalType);

  const handleClientClick = (clientId: number) => {
    setSelectedClientId(clientId);
    setClientDetailOpen(true);
  };

  const handleAddClient = () => {
    setEditingClientId(null);
    setClientFormOpen(true);
  };

  const handleContractDateClick = (clients: ClientWithTeam[], date: string) => {
    setContractClientsModal({
      open: true,
      clients,
      date
    });
  };


  const closeModal = () => setActiveModal(null);

  // Image tracking functions
  const todayImageCount = todayImageData?.count || 0;

  const handleImageSubmit = () => {
    const count = parseInt(imageInput);
    if (!isNaN(count) && count >= 0) {
      updateImageCountMutation.mutate(count);
      setImageInput('');
    }
  };

  const handleDateClick = (date: string, currentCount: number) => {
    setSelectedDate(date);
    setDateImageInput(currentCount.toString());
    setActiveModal('date-image-edit');
  };

  const handleDateImageSubmit = () => {
    if (!selectedDate) return;
    const count = parseInt(dateImageInput);
    if (!isNaN(count) && count >= 0) {
      updateDateImageCountMutation.mutate({ date: selectedDate, count });
      setActiveModal(null);
      setSelectedDate(null);
      setDateImageInput('');
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Generate calendar heatmap data
  const generateCalendarData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = startOfMonth(currentDate);
    const startingDayOfWeek = (getDay(firstDayOfMonth) + 6) % 7; // Convert Sunday=0 to Monday=0
    
    const calendar = [];
    const imageCountMap = new Map();
    
    // Create map of dates to image counts
    monthlyImageData.forEach((item: any) => {
      imageCountMap.set(item.date, item.imageCount);
    });
    
    // Calculate max count for color intensity
    const maxCount = Math.max(...monthlyImageData.map((item: any) => item.imageCount), 1);
    
    // Get today's date for highlighting
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendar.push({ day: '', count: 0, isEmpty: true, isToday: false });
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const count = imageCountMap.get(dateStr) || 0;
      const intensity = count === 0 ? 0 : Math.ceil((count / maxCount) * 4);
      const isToday = dateStr === today;
      
      // Find clients who started contracts on this date
      const contractStartClients = clients.filter(client => {
        if (!client.contractStartDate) return false;
        const clientContractDate = format(new Date(client.contractStartDate), 'yyyy-MM-dd');
        return clientContractDate === dateStr;
      });
      
      calendar.push({
        day: day.toString(),
        count,
        intensity,
        date: dateStr,
        isEmpty: false,
        isToday,
        contractStartClients
      });
    }
    
    return calendar;
  };

  const getHeatmapColor = (intensity: number) => {
    const colors = [
      'bg-gray-100 text-gray-400', // 0 - no data
      'bg-green-100 text-green-700', // 1 - low
      'bg-green-200 text-green-800', // 2 - medium-low  
      'bg-green-300 text-green-900', // 3 - medium-high
      'bg-green-400 text-white'  // 4 - high
    ];
    return colors[intensity] || colors[0];
  };

  // Generate unique pastel colors for each client
  const getClientColor = (clientId: number) => {
    const colors = [
      'bg-pink-200/80 text-pink-800 border-pink-300',
      'bg-purple-200/80 text-purple-800 border-purple-300',
      'bg-blue-200/80 text-blue-800 border-blue-300',
      'bg-green-200/80 text-green-800 border-green-300',
      'bg-yellow-200/80 text-yellow-800 border-yellow-300',
      'bg-indigo-200/80 text-indigo-800 border-indigo-300',
      'bg-orange-200/80 text-orange-800 border-orange-300',
      'bg-teal-200/80 text-teal-800 border-teal-300',
      'bg-cyan-200/80 text-cyan-800 border-cyan-300',
      'bg-lime-200/80 text-lime-800 border-lime-300',
      'bg-emerald-200/80 text-emerald-800 border-emerald-300',
      'bg-violet-200/80 text-violet-800 border-violet-300'
    ];
    return colors[clientId % colors.length];
  };

  const fireConfetti = (clientId: number) => {
    const buttonElement = buttonRefs.current.get(clientId);
    if (!buttonElement) return;

    const rect = buttonElement.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    // Get client color scheme for confetti
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#10ac84', '#ee5a24'];
    
    // Fire multiple bursts for better effect
    const burst1 = confetti({
      particleCount: 30,
      spread: 70,
      origin: { x, y },
      colors: colors,
      shapes: ['circle', 'square'],
      scalar: 0.8,
      gravity: 0.6,
      drift: 0.1,
      ticks: 200
    });

    setTimeout(() => {
      confetti({
        particleCount: 20,
        spread: 50,
        origin: { x, y },
        colors: colors,
        shapes: ['circle'],
        scalar: 0.6,
        gravity: 0.8,
        drift: -0.1,
        ticks: 150
      });
    }, 100);
  };

  // Initialize checked clients from today's work sessions
  React.useEffect(() => {
    if (todayWorkSessions.length > 0) {
      const workedClientIds = new Set(todayWorkSessions.map((session: any) => session.clientId));
      setCheckedClients(workedClientIds);
      
      // Update last worked text
      const lastWorkedMap = new Map();
      todayWorkSessions.forEach((session: any) => {
        lastWorkedMap.set(session.clientId, "worked today");
      });
      setClientLastWorked(lastWorkedMap);
    }
  }, [todayWorkSessions]);

  const toggleClientCheck = (clientId: number) => {
    const isCurrentlyChecked = checkedClients.has(clientId);
    
    if (isCurrentlyChecked) {
      // Remove from checked clients and delete work session
      deleteWorkSessionMutation.mutate(clientId);
      setCheckedClients(prev => {
        const newSet = new Set(prev);
        newSet.delete(clientId);
        return newSet;
      });
      setClientLastWorked(prev => {
        const newMap = new Map(prev);
        newMap.delete(clientId);
        return newMap;
      });
    } else {
      // Add to checked clients and create work session
      createWorkSessionMutation.mutate(clientId);
      setCheckedClients(prev => {
        const newSet = new Set(prev);
        newSet.add(clientId);
        return newSet;
      });
      setClientLastWorked(prev => {
        const newMap = new Map(prev);
        newMap.set(clientId, "worked today");
        return newMap;
      });
      // Fire confetti animation
      fireConfetti(clientId);
    }
  };

  const getLastWorkedText = (clientId: number) => {
    const isCheckedToday = checkedClients.has(clientId);
    if (isCheckedToday) {
      return "worked today";
    }
    
    const lastWorkedDate = clientLastWorked.get(clientId);
    if (!lastWorkedDate) {
      return "never worked";
    }
    
    const today = new Date();
    const lastWorked = new Date(lastWorkedDate);
    const diffTime = Math.abs(today.getTime() - lastWorked.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return "1 day ago";
    } else {
      return `${diffDays} days ago`;
    }
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-slate-600 mt-1">Overview of your jewelry AI business</p>
        </div>
      </div>
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        {/* Active Clients */}
        <Card 
          className="bg-gradient-to-br from-orange-100/80 to-orange-200/80 backdrop-blur-sm border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden"
          onClick={() => openModal('active-clients')}
        >
          <CardContent className="p-4 md:p-6 relative">
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xs md:text-sm font-medium text-slate-600">Active Clients</h3>
                <Users className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
              </div>
              <div className="flex-1 flex items-center">
                <div className="text-2xl md:text-3xl font-bold text-orange-700">
                  {activeClients.length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card 
          className="bg-gradient-to-br from-green-100/80 to-emerald-200/80 backdrop-blur-sm border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden"
          onClick={() => openModal('total-revenue')}
        >
          <CardContent className="p-4 md:p-6 relative">
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xs md:text-sm font-medium text-slate-600">Total Revenue</h3>
                <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
              </div>
              <div className="flex-1 flex items-center">
                <div className="text-2xl md:text-3xl font-bold text-green-700">
                  {convertCurrency(totalRevenue)}
                </div>
              </div>
              <div className="absolute bottom-4 right-4">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCurrency();
                  }}
                  className="p-1.5 md:p-2 bg-white/40 rounded-full hover:bg-white/60 transition-colors"
                >
                  <RefreshCw className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Revenue */}
        <Card 
          className="bg-gradient-to-br from-purple-100/80 to-pink-200/80 backdrop-blur-sm border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden"
          onClick={() => openModal('monthly-revenue')}
        >
          <CardContent className="p-4 md:p-6 relative">
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xs md:text-sm font-medium text-slate-600">Monthly Revenue</h3>
                <Calendar className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
              </div>
              <div className="flex-1 flex items-center">
                <div className="text-2xl md:text-3xl font-bold text-purple-700">
                  {convertCurrency(monthlyRevenue)}
                </div>
              </div>
              <div className="absolute bottom-4 right-4">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCurrency();
                  }}
                  className="p-1.5 md:p-2 bg-white/40 rounded-full hover:bg-white/60 transition-colors"
                >
                  <RefreshCw className="w-3 h-3 md:w-4 md:h-4 text-purple-600" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Stats */}
        <Card 
          className="bg-gradient-to-br from-blue-100/80 to-indigo-200/80 backdrop-blur-sm border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden"
          onClick={() => openModal('progress-stats')}
        >
          <CardContent className="p-4 md:p-6 relative">
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xs md:text-sm font-medium text-slate-600">Project Progress</h3>
                <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
              </div>
              <div className="flex-1 flex items-center mb-3">
                <div className="text-2xl md:text-3xl font-bold text-blue-700">
                  {overallProgress}%
                </div>
              </div>
              <Progress 
                value={overallProgress} 
                className="h-2 md:h-3 bg-white/40" 
                style={{ '--progress-foreground': '#22c55e' } as React.CSSProperties}
              />
            </div>
          </CardContent>
        </Card>

      </div>
      {/* Daily Image Tracking - Mobile Optimized */}
      <Card className="bg-white/90 backdrop-blur-sm border-white/50 shadow-lg mb-6">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-shrink-0">
              <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
              <span className="text-xs sm:text-sm font-medium text-slate-700">Today's Images:</span>
              <span className="text-lg sm:text-xl font-bold text-orange-600 min-w-[24px]">{todayImageCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="00"
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleImageSubmit()}
                className="w-16 h-8 text-center text-sm"
                min="0"
              />
              <Button
                onClick={handleImageSubmit}
                disabled={updateImageCountMutation.isPending}
                size="sm"
                className="h-8 w-8 p-0 bg-orange-500 hover:bg-orange-600 flex-shrink-0"
                title="Set count"
              >
                {updateImageCountMutation.isPending ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <span className="text-xs">✓</span>
                )}
              </Button>
            </div>
          </div>
          
        </CardContent>
      </Card>
      

      {/* Client Project Tracking */}
      <Card className="bg-white/90 backdrop-blur-sm border-white/50 shadow-lg mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-700 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              We worked on
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-4">
            {activeClients.map((client) => {
              const isChecked = checkedClients.has(client.id);
              return (
                <button
                  key={client.id}
                  ref={(el) => {
                    if (el) {
                      buttonRefs.current.set(client.id, el);
                    } else {
                      buttonRefs.current.delete(client.id);
                    }
                  }}
                  onClick={() => toggleClientCheck(client.id)}
                  className={`
                    inline-flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 rounded-lg border-2 transition-all duration-300 
                    hover:scale-105 hover:shadow-md backdrop-blur-sm text-left group min-w-0 sm:min-w-[140px]
                    ${isChecked 
                      ? `${getClientColor(client.id)} shadow-lg transform scale-105` 
                      : 'bg-white/60 text-slate-700 border-slate-200 hover:bg-white/80 hover:border-slate-300'
                    }
                  `}
                >
                  <div className={`
                    flex items-center justify-center w-3 h-3 sm:w-4 sm:h-4 rounded border-2 transition-all duration-300 flex-shrink-0
                    ${isChecked 
                      ? 'bg-current border-current animate-[checkbox-check_0.3s_ease-in-out]' 
                      : 'border-slate-400 bg-white'
                    }
                  `}>
                    {isChecked && (
                      <svg 
                        className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white animate-[checkmark_0.3s_ease-in-out]" 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path 
                          fillRule="evenodd" 
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0 overflow-hidden">
                    <div className={`font-medium text-xs sm:text-sm truncate ${isChecked ? 'text-inherit' : 'text-slate-700'}`}>
                      {client.name}
                    </div>
                    <div className={`text-xs truncate ${isChecked ? 'text-current opacity-80' : 'text-slate-500'}`}>
                      {getLastWorkedText(client.id)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          
          {activeClients.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <UserCheck className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>No active clients</p>
              <p className="text-sm">Clients with "Planning" or "Running" status will appear here</p>
              <Button
                onClick={handleAddClient}
                className="mt-4 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Client
              </Button>
            </div>
          )}
          
          
        </CardContent>
      </Card>
      {/* macOS-Style Tabbed Calendar */}
      <div className="mb-6">
        {/* Browser Window Frame */}
        <div className="bg-white rounded-xl shadow-xl border border-gray-200/50 overflow-hidden">
          {/* Browser Title Bar with Tabs */}
          <div className="px-4 py-2 flex items-stretch bg-[#f0f0f0]">
            {/* macOS Window Controls */}
            <div className="flex items-center gap-2 mr-4">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            
            {/* Browser Tabs */}
            <div className="flex items-end">
              {/* Work Tab */}
              <div
                className={`
                  relative px-6 py-3 text-sm font-medium cursor-pointer transition-all duration-200 rounded-t-lg border-t border-l border-r border-gray-300
                  ${activeCalendarTab === 'work'
                    ? 'bg-white text-gray-800 border-b-0 -mb-px z-10'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-250 border-b border-gray-300'
                  }
                `}
                onClick={() => setActiveCalendarTab('work')}
              >
                Work
              </div>

              {/* Finances Tab */}
              <div
                className={`
                  relative px-6 py-3 text-sm font-medium cursor-pointer transition-all duration-200 rounded-t-lg border-t border-l border-r border-gray-300 -ml-px
                  ${activeCalendarTab === 'finances'
                    ? 'bg-white text-gray-800 border-b-0 -mb-px z-10'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-250 border-b border-gray-300'
                  }
                `}
                onClick={() => setActiveCalendarTab('finances')}
              >
                Finances
              </div>
            </div>
          </div>

          {/* Calendar Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200 border-l border-r border-gray-300">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                {activeCalendarTab === 'work' ? (
                  <>
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{format(currentDate, 'MMMM yyyy')}</h2>
                      <p className="text-sm text-gray-500">Daily image creation tracking</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{format(currentDate, 'MMMM yyyy')}</h2>
                      <p className="text-sm text-gray-500">Client payment tracking</p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                  className="h-9 w-9 p-0 border-gray-300 hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                  className="h-9 w-9 p-0 border-gray-300 hover:bg-gray-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Calendar Content */}
          <div className="bg-white border-l border-r border-b border-gray-300 rounded-b-xl">
            <div className="p-6">
          {activeCalendarTab === 'work' ? (
            <div className="space-y-4">
              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-2">
                {generateCalendarData().map((day, index) => (
                  <div
                    key={index}
                    className={`
                      h-10 w-full rounded-lg flex items-center justify-center text-sm font-medium
                      border transition-all duration-200 relative
                      ${day.isEmpty 
                        ? 'invisible' 
                        : day.isToday
                          ? `${getHeatmapColor(day.intensity)} hover:scale-105 cursor-pointer border-2 border-blue-500 shadow-lg ring-2 ring-blue-200`
                          : `${getHeatmapColor(day.intensity)} hover:scale-105 cursor-pointer border-gray-200 hover:border-gray-300`
                      }
                    `}
                    title={day.isEmpty ? '' : `${day.date}: ${day.count} images (click to edit)${day.isToday ? ' - Today' : ''}`}
                    onClick={() => !day.isEmpty && handleDateClick(day.date, day.count)}
                  >
                    {day.day}
                    {day.isToday && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-xs text-gray-500">Less</span>
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map(intensity => (
                    <div
                      key={intensity}
                      className={`w-3 h-3 rounded ${getHeatmapColor(intensity)} border border-gray-200`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500">More</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Financial Calendar days */}
              <div className="grid grid-cols-7 gap-2">
                {generateCalendarData().map((day, index) => {
                  const dateStr = day.date;
                  
                  // Get payments for this date
                  const dayPayments = allTransactions.filter((transaction: any) => {
                    const transactionDate = new Date(transaction.createdAt || transaction.date);
                    const transactionDateStr = format(transactionDate, 'yyyy-MM-dd');
                    return transactionDateStr === dateStr && transaction.type === 'income';
                  });

                  // Get marketing transactions for this date
                  const dayMarketingTransactions = marketingTransactions.filter((transaction: any) => {
                    const transactionDate = new Date(transaction.date);
                    const transactionDateStr = format(transactionDate, 'yyyy-MM-dd');
                    return transactionDateStr === dateStr;
                  });

                  const hasPayments = dayPayments.length > 0;
                  const hasMarketingTransactions = dayMarketingTransactions.length > 0;
                  const contractStartClients = day.contractStartClients || [];
                  const hasContractStarts = contractStartClients.length > 0;

                  return (
                    <div
                      key={index}
                      className={`
                        h-10 w-full rounded-lg flex items-center justify-center text-sm font-medium
                        border transition-all duration-200 relative
                        ${day.isEmpty 
                          ? 'invisible' 
                          : day.isToday
                            ? hasContractStarts || hasPayments || hasMarketingTransactions 
                              ? 'bg-gradient-to-br from-emerald-100 to-green-100 border-2 border-blue-500 shadow-lg ring-2 ring-blue-200'
                              : 'bg-gray-50 border-2 border-blue-500 shadow-lg ring-2 ring-blue-200'
                            : hasContractStarts
                              ? 'bg-gradient-to-br from-emerald-100 to-green-100 border-emerald-300 shadow-sm hover:scale-105 cursor-pointer'
                              : hasPayments 
                                ? 'bg-gradient-to-br from-blue-100 to-indigo-100 border-blue-300 shadow-sm hover:scale-105 cursor-pointer' 
                                : hasMarketingTransactions
                                  ? 'bg-gradient-to-br from-purple-100 to-pink-100 border-purple-300 shadow-sm hover:scale-105 cursor-pointer'
                                  : 'bg-gray-50 border-gray-200 hover:scale-105 cursor-pointer hover:border-gray-300'
                        }
                      `}
                      title={day.isEmpty ? '' : [
                        hasPayments ? `${dayPayments.length} payment(s) received` : '',
                        hasMarketingTransactions ? `${dayMarketingTransactions.length} marketing transaction(s): ${dayMarketingTransactions.map(t => `${t.name} (${formatCurrencyWithUSD(t.amount, t.currency)})`).join(', ')}` : '',
                        hasContractStarts ? `${contractStartClients.length} client(s) started: ${contractStartClients.map(c => c.name).join(', ')} (click to view)` : '',
                        day.isToday ? 'Today' : ''
                      ].filter(Boolean).join(' | ')}
                      onClick={() => hasContractStarts && handleContractDateClick(contractStartClients, day.date)}
                    >
                      {day.isEmpty ? '' : (
                        <>
                          {!hasContractStarts && <span className="text-slate-700 z-10">{day.day}</span>}
                          {/* Payment indicator */}
                          {hasPayments && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center z-20">
                              <span className="text-xs text-white font-bold">{dayPayments.length}</span>
                            </div>
                          )}
                          
                          {/* Marketing transaction indicator */}
                          {hasMarketingTransactions && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-purple-500 rounded-full flex items-center justify-center z-20">
                              <span className="text-xs text-white font-bold">{dayMarketingTransactions.length}</span>
                            </div>
                          )}
                          {/* Today indicator */}
                          {day.isToday && (
                            <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full z-20"></div>
                          )}
                          {/* Client contract start logos */}
                          {hasContractStarts && (
                            <div className="absolute inset-0 flex items-center justify-center z-5">
                              <div className="flex -space-x-1">
                                {contractStartClients.slice(0, 2).map((client, clientIndex) => (
                                  <Avatar key={client.id} className="w-6 h-6 border border-white shadow-sm">
                                    <AvatarImage src={client.logoUrl} alt={client.name} />
                                    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-500 text-white text-xs font-bold">
                                      {client.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                                {contractStartClients.length > 2 && (
                                  <div className="w-6 h-6 rounded-full bg-gray-300 border border-white shadow-sm flex items-center justify-center">
                                    <span className="text-xs font-bold text-gray-600">+{contractStartClients.length - 2}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Marketing transaction logos */}
                          {hasMarketingTransactions && !hasContractStarts && (
                            <div className="absolute inset-0 flex items-center justify-center z-5">
                              <div className="flex -space-x-1">
                                {dayMarketingTransactions.slice(0, 2).map((transaction, transactionIndex) => (
                                  <div key={transaction.id} className="w-6 h-6 rounded-lg border border-white shadow-sm overflow-hidden">
                                    {transaction.logo ? (
                                      <img 
                                        src={transaction.logo} 
                                        alt={transaction.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                                        <span className="text-xs text-white font-bold">
                                          {transaction.name.substring(0, 2).toUpperCase()}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                                {dayMarketingTransactions.length > 2 && (
                                  <div className="w-6 h-6 rounded-lg bg-gray-300 border border-white shadow-sm flex items-center justify-center">
                                    <span className="text-xs text-gray-600 font-bold">+{dayMarketingTransactions.length - 2}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Financial Legend */}
              <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-200 flex-wrap">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-3 h-3 bg-gray-100 rounded border"></div>
                  <span>No payments</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-3 h-3 bg-gradient-to-br from-emerald-100 to-green-100 rounded border border-emerald-300"></div>
                  <span>Payment received</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span>Payment count</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-3 h-3 bg-gradient-to-br from-emerald-100 to-green-100 rounded border border-emerald-300"></div>
                  <span>Contract started</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-3 h-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded border border-purple-300"></div>
                  <span>Marketing transaction</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span>Marketing count</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-3 h-3 border-2 border-blue-500 rounded"></div>
                  <span>Today</span>
                </div>
              </div>
            </div>
          )}
            </div>
          </div>
        </div>
      </div>
      {/* Recent Activity */}
      <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTransactions.length > 0 ? recentTransactions.map((transaction, index) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg hover:bg-white/70 transition-colors">
                <div className="flex items-center space-x-3 flex-1">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    transaction.type === 'incoming' ? 'bg-green-500' : 
                    transaction.category === 'Salary' ? 'bg-blue-500' : 'bg-orange-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-800 truncate">{transaction.name}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span>{format(transaction.date, 'MMM dd, yyyy')}</span>
                      {transaction.teamMember && (
                        <>
                          <span>•</span>
                          <span className="truncate">Assigned to {transaction.teamMember}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`font-bold text-sm ${
                    transaction.type === 'incoming' ? 'text-green-600' : 
                    transaction.category === 'Salary' ? 'text-blue-600' : 'text-orange-600'
                  }`}>
                    {transaction.type === 'incoming' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </span>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-slate-500">
                <Activity className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>No recent activity</p>
                <p className="text-xs mt-2">Transactions from the last 7 days will appear here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Modal Components */}
      {renderModal()}
      
      {/* Client Detail Modal */}
      <ClientDetailModal
        clientId={selectedClientId}
        open={clientDetailOpen}
        onOpenChange={(open) => {
          setClientDetailOpen(open);
          if (!open) setSelectedClientId(null);
        }}
      />

      {/* Client Form Modal */}
      <ClientFormModal
        open={clientFormOpen}
        onOpenChange={(open) => {
          setClientFormOpen(open);
          if (!open) setEditingClientId(null);
        }}
        editingClientId={editingClientId}
      />

      {/* Contract Clients Modal */}
      <Dialog 
        open={contractClientsModal.open} 
        onOpenChange={(open) => setContractClientsModal({ ...contractClientsModal, open })}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Contracts Started on {contractClientsModal.date ? format(new Date(contractClientsModal.date), 'MMMM dd, yyyy') : ''}
            </DialogTitle>
            <DialogDescription>
              Client contracts that began on this date
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {contractClientsModal.clients.map((client) => {
              const totalWork = (client.totalImagesToMake || 0) + (client.totalJewelryArticles || 0);
              const completedWork = (client.imagesMade || 0) + (client.jewelryArticlesMade || 0);
              const progress = totalWork > 0 ? Math.round((completedWork / totalWork) * 100) : 0;
              const amountPaidUSD = parseFloat(client.amountPaidUSD?.toString() || client.amountPaid.toString());
              const totalFeeUSD = parseFloat(client.totalProjectFeeUSD?.toString() || client.totalProjectFee.toString());
              
              return (
                <div key={client.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={client.logoUrl} alt={client.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold">
                      {client.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-slate-900">{client.name}</h3>
                      <Badge 
                        className={`${
                          client.projectStatus?.toLowerCase() === 'running' 
                            ? 'bg-green-100 text-green-800' 
                            : client.projectStatus?.toLowerCase() === 'completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {client.projectStatus}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-600">Contact:</span>
                        <p className="font-medium">{client.contactPerson}</p>
                      </div>
                      <div>
                        <span className="text-slate-600">Location:</span>
                        <p className="font-medium">{client.country}</p>
                      </div>
                      <div>
                        <span className="text-slate-600">Project Fee:</span>
                        <p className="font-medium text-green-600">${Math.round(totalFeeUSD).toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-slate-600">Amount Paid:</span>
                        <p className="font-medium text-blue-600">${Math.round(amountPaidUSD).toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-600">Progress</span>
                        <span className="text-xs font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedClientId(client.id);
                      setClientDetailOpen(true);
                      setContractClientsModal({ ...contractClientsModal, open: false });
                    }}
                  >
                    View Details
                  </Button>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  function renderModal() {
    if (!activeModal) return null;

    const modalContent = {
      'active-clients': {
        title: 'Active Clients',
        content: (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {activeClients.length > 0 ? activeClients.map((client) => (
              <div key={client.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                    {client.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{client.name}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Progress 
                        value={((client.articlesCompleted || 0) / (client.articlesToGenerate || 1)) * 100} 
                        className="w-24 h-2" 
                      />
                      <span className="text-xs text-slate-500">
                        {Math.round(((client.articlesCompleted || 0) / (client.articlesToGenerate || 1)) * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant={client.projectStatus?.toLowerCase() === 'running' ? 'default' : 'secondary'} 
                        className={`text-xs ${client.projectStatus?.toLowerCase() === 'running' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}
                      >
                        {client.projectStatus}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600 text-lg">
                    {convertCurrency(parseFloat(client.amountPaidUSD?.toString() || client.amountPaid.toString()))}
                  </p>
                  <p className="text-xs text-slate-500">
                    {client.articlesCompleted || 0}/{client.articlesToGenerate || 0} articles
                  </p>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>No active clients with running or planning status</p>
              </div>
            )}
          </div>
        )
      },
      'total-revenue': {
        title: 'Total Revenue Breakdown',
        content: (
          <div className="space-y-4">
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-700">{formatCurrency(totalRevenue)}</p>
              <p className="text-slate-600">Total Revenue</p>
            </div>
            <div className="space-y-3">
              {clients.filter(c => parseFloat(c.amountPaidUSD?.toString() || c.amountPaid.toString()) > 0)
                .sort((a, b) => parseFloat(b.amountPaidUSD?.toString() || b.amountPaid.toString()) - parseFloat(a.amountPaidUSD?.toString() || a.amountPaid.toString()))
                .map((client) => (
                <div key={client.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="font-medium">{client.name}</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(parseFloat(client.amountPaidUSD?.toString() || client.amountPaid.toString()))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      },
      'monthly-revenue': {
        title: 'Monthly Revenue Details',
        content: (
          <div className="space-y-4">
            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <p className="text-3xl font-bold text-purple-700">{convertCurrency(monthlyRevenue)}</p>
              <p className="text-slate-600">Revenue This Month</p>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-slate-600 font-medium">Clients who paid this month:</p>
              {clients.filter(c => {
                const clientDate = new Date(c.createdAt);
                return clientDate.getMonth() === currentMonth && clientDate.getFullYear() === currentYear;
              }).map((client) => (
                <div key={client.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="font-medium">{client.name}</span>
                  <span className="font-bold text-purple-600">
                    {convertCurrency(parseFloat(client.amountPaidUSD?.toString() || client.amountPaid.toString()))}
                  </span>
                </div>
              ))}
              {clients.filter(c => {
                const clientDate = new Date(c.createdAt);
                return clientDate.getMonth() === currentMonth && clientDate.getFullYear() === currentYear;
              }).length === 0 && (
                <p className="text-slate-500 text-center py-4">No payments this month</p>
              )}
            </div>
          </div>
        )
      },
      'progress-stats': {
        title: 'Active Project Progress',
        content: (
          <div className="space-y-4">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-700">{overallProgress}%</p>
              <p className="text-slate-600">Overall Progress (Active Clients)</p>
              <Progress value={overallProgress} className="mt-3" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-700">{totalImagesMade}</p>
                <p className="text-sm text-slate-600">Images Made</p>
                <p className="text-xs text-slate-500">of {totalImagesRequested} requested</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-700">{totalJewelryMade}</p>
                <p className="text-sm text-slate-600">Jewelry Articles</p>
                <p className="text-xs text-slate-500">of {totalJewelryRequested} requested</p>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700">Active Client Breakdown:</p>
              {activeClients.filter(c => 
                (c.totalImagesToMake || 0) > 0 || (c.totalJewelryArticles || 0) > 0
              ).map((client) => {
                const clientImageProgress = (client.totalImagesToMake || 0) > 0 ? 
                  ((client.imagesMade || 0) / (client.totalImagesToMake || 1)) * 100 : 0;
                const clientJewelryProgress = (client.totalJewelryArticles || 0) > 0 ? 
                  ((client.jewelryArticlesMade || 0) / (client.totalJewelryArticles || 1)) * 100 : 0;
                const totalClientWork = (client.totalImagesToMake || 0) + (client.totalJewelryArticles || 0);
                const completedClientWork = (client.imagesMade || 0) + (client.jewelryArticlesMade || 0);
                const overallClientProgress = totalClientWork > 0 ? (completedClientWork / totalClientWork) * 100 : 0;
                
                return (
                  <div key={client.id} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{client.name}</span>
                      <div className="text-sm font-bold text-blue-600">
                        {overallClientProgress.toFixed(0)}%
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                      <div>
                        Images: {client.imagesMade || 0} / {client.totalImagesToMake || 0}
                      </div>
                      <div>
                        Jewelry: {client.jewelryArticlesMade || 0} / {client.totalJewelryArticles || 0}
                      </div>
                    </div>
                    <Progress 
                      value={overallClientProgress} 
                      className="h-2 mt-2" 
                    />
                  </div>
                );
              })}
              {activeClients.filter(c => 
                (c.totalImagesToMake || 0) > 0 || (c.totalJewelryArticles || 0) > 0
              ).length === 0 && (
                <p className="text-slate-500 text-center py-4">No active projects with targets set</p>
              )}
            </div>
          </div>
        )
      },
      'image-tracking': {
        title: 'Image Creation Calendar',
        content: (
          <div className="space-y-4">
            {/* Calendar Header */}
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-semibold">
                {format(currentDate, 'MMMM yyyy')}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Today's stats */}
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-orange-600">{todayImageCount}</div>
                  <div className="text-sm text-slate-600">Images created today</div>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="0"
                    value={imageInput}
                    onChange={(e) => setImageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleImageSubmit()}
                    className="w-20 h-8 text-xs"
                    min="0"
                  />
                  <Button
                    onClick={handleImageSubmit}
                    disabled={updateImageCountMutation.isPending}
                    size="sm"
                    className="h-8 px-3 text-xs bg-orange-500 hover:bg-orange-600"
                  >
                    {updateImageCountMutation.isPending ? 'Saving...' : 'Update'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="space-y-2">
              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-1 text-xs font-medium text-slate-500 text-center">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>
              
              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {generateCalendarData().map((day, index) => (
                  <div
                    key={index}
                    className={`
                      h-8 w-8 rounded flex items-center justify-center text-xs
                      ${day.isEmpty 
                        ? 'invisible' 
                        : `${getHeatmapColor(day.intensity)} hover:bg-opacity-80 cursor-pointer transition-colors`
                      }
                    `}
                    title={day.isEmpty ? '' : `${day.date}: ${day.count} images`}
                  >
                    {day.day}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Less</span>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map(intensity => (
                  <div
                    key={intensity}
                    className={`w-3 h-3 rounded ${getHeatmapColor(intensity)}`}
                  />
                ))}
              </div>
              <span>More</span>
            </div>

            <div className="text-xs text-slate-500 text-center">
              Daily count resets at midnight IST
            </div>
          </div>
        )
      },
      'date-image-edit': {
        title: `Edit Images for ${selectedDate ? format(new Date(selectedDate), 'MMM dd, yyyy') : ''}`,
        content: (
          <div className="space-y-4">
            <div className="text-center p-6 bg-orange-50 rounded-lg">
              <div className="text-sm text-slate-600 mb-2">
                {selectedDate ? format(new Date(selectedDate), 'EEEE, MMMM dd, yyyy') : ''}
              </div>
              <div className="flex items-center justify-center gap-4">
                <Input
                  type="number"
                  placeholder="0"
                  value={dateImageInput}
                  onChange={(e) => setDateImageInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDateImageSubmit()}
                  className="w-24 h-12 text-center text-lg font-bold"
                  min="0"
                  autoFocus
                />
                <div className="text-sm text-slate-600">images</div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                onClick={() => {
                  setActiveModal(null);
                  setSelectedDate(null);
                  setDateImageInput('');
                }}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDateImageSubmit}
                disabled={updateDateImageCountMutation.isPending}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {updateDateImageCountMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        )
      }
    };

    const modal = modalContent[activeModal as keyof typeof modalContent];

    return (
      <Dialog open={!!activeModal} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[600px] bg-white/90 backdrop-blur-xl border-white/20">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              {modal.title}
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Detailed information and breakdown for {modal.title.toLowerCase()}
            </DialogDescription>
          </DialogHeader>
          {modal.content}
        </DialogContent>
      </Dialog>
    );
  }
}