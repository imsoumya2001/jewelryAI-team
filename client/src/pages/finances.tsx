import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Filter,
  Users,
  Edit,
  Trash2
} from "lucide-react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ClientWithTeam, TeamMember } from "@shared/schema";
import ManualTransactionModal from "@/components/manual-transaction-modal";
import TransactionEditModal from "@/components/transaction-edit-modal";

export default function FinancesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [periodFilter, setPeriodFilter] = useState("month");
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Success",
        description: "Transaction deleted successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive"
      });
    }
  });

  // Fetch real client data and transactions
  const { data: clients = [] } = useQuery<ClientWithTeam[]>({
    queryKey: ["/api/clients"],
  });

  const { data: allTransactions = [] } = useQuery<any[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: teamMembers = [] } = useQuery<any[]>({
    queryKey: ["/api/team-members"],
  });

  // Calculate real financial metrics from client data and transactions
  const clientIncome = clients.reduce((sum, client) => 
    sum + parseFloat(client.amountPaidUSD?.toString() || client.amountPaid.toString()), 0);

  const transactionIncome = allTransactions
    .filter(t => t.type === 'manual_income' || t.type === 'incoming')
    .reduce((sum, t) => sum + parseFloat(t.amountUSD || t.amount), 0);

  const totalIncoming = clientIncome + transactionIncome;

  const totalContractValue = clients.reduce((sum, client) => 
    sum + parseFloat(client.totalProjectFeeUSD?.toString() || client.totalProjectFee.toString()), 0);

  const pendingRevenue = totalContractValue - clientIncome;

  const totalOutgoing = allTransactions
    .filter(t => t.type === 'payment_to_team' || t.type === 'expense' || t.type === 'manual_expense' || t.category === 'Expenses')
    .reduce((sum, t) => sum + parseFloat(t.amountUSD || t.amount), 0);

  // Calculate team payments (salary category)
  const teamPayments = allTransactions
    .filter(t => t.category === 'Salary')
    .reduce((sum, t) => sum + parseFloat(t.amountUSD || t.amount), 0);

  // Calculate expenses (expenses category)
  const totalExpenses = allTransactions
    .filter(t => t.category === 'Expenses')
    .reduce((sum, t) => sum + parseFloat(t.amountUSD || t.amount), 0);

  const netProfit = totalIncoming - totalOutgoing;

  // Calculate growth percentage based on actual data (removing fake percentage)
  const growthPercentage = totalIncoming > 0 ? 
    ((netProfit / totalIncoming) * 100).toFixed(1) : 
    "0.0";

  // Create client payment transactions (these are read-only for display)
  const clientTransactions = clients.map(client => ({
    id: `client-${client.id}`,
    type: "incoming" as const,
    amount: parseFloat(client.amountPaidUSD?.toString() || client.amountPaid.toString()),
    client: client.name,
    teamMember: client.assignments?.[0]?.teamMember?.name || null,
    description: `Payment from ${client.name}`,
    date: new Date(client.createdAt),
    currency: client.feeCurrency || 'USD',
    category: "revenue",
    teamMemberId: client.assignments?.[0]?.teamMemberId || null,
    isClientPayment: true
  })).filter(t => t.amount > 0);

  const manualTransactions = allTransactions.map(t => ({
    id: t.id,
    type: t.type,
    amount: parseFloat(t.amountUSD || t.amount),
    client: t.clientId ? clients.find(c => c.id === t.clientId)?.name || 'Unknown Client' : 'Manual Entry',
    teamMember: t.teamMemberId ? teamMembers.find(tm => tm.id === t.teamMemberId)?.name || `Team Member ${t.teamMemberId}` : null,
    description: t.description,
    date: new Date(t.date || t.createdAt),
    currency: t.currency || 'USD',
    category: t.category || null,
    teamMemberId: t.teamMemberId || null,
    isClientPayment: false
  }));

  const transactions = [...clientTransactions, ...manualTransactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate monthly metrics
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyRevenue = transactions
    .filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear &&
             (t.type === 'incoming' || t.isClientPayment);
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyTeamPayments = transactions
    .filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear &&
             (t.type === 'payment_to_team' || t.type === 'salary' || t.category === 'Salary');
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = transactions
    .filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear &&
             (t.type === 'expenses' || t.category === 'Expenses');
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-3 sm:p-6 relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-gradient-to-r from-green-400/10 to-emerald-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>
      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg shadow-green-500/5 p-4 sm:p-6 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300 group">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="group-hover:transform group-hover:translate-x-1 transition-transform duration-200">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent group-hover:from-green-600 group-hover:to-emerald-600 transition-all duration-300">
                Finances
              </h1>
              <p className="text-slate-600 mt-1 text-sm sm:text-base opacity-80 group-hover:opacity-100 transition-opacity">Track income, expenses, and team payments</p>
            </div>
            <Button 
              onClick={() => setShowTransactionModal(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 group/btn"
            >
              <Plus className="w-4 h-4 mr-2 group-hover/btn:rotate-90 transition-transform duration-200" />
              Add Transaction
            </Button>
          </div>
        </div>

        {/* Dashboard-Style Bento Cards */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
          {/* Total Revenue */}
          <Card className="bg-gradient-to-br from-green-100/80 to-emerald-200/80 backdrop-blur-sm border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden">
            <CardContent className="p-4 md:p-6 relative">
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xs md:text-sm font-medium text-slate-600">Total Revenue</h3>
                  <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                </div>
                <div className="flex-1 flex items-center">
                  <div className="text-2xl md:text-3xl font-bold text-green-700">
                    {formatCurrency(totalIncoming)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Revenue */}
          <Card className="bg-gradient-to-br from-purple-100/80 to-purple-200/80 backdrop-blur-sm border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden">
            <CardContent className="p-4 md:p-6 relative">
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xs md:text-sm font-medium text-slate-600">Monthly Revenue</h3>
                  <Calendar className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                </div>
                <div className="flex-1 flex items-center">
                  <div className="text-2xl md:text-3xl font-bold text-purple-700">
                    {formatCurrency(monthlyRevenue)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Payments */}
          <Card className="bg-gradient-to-br from-red-100/80 to-red-200/80 backdrop-blur-sm border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden">
            <CardContent className="p-4 md:p-6 relative">
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xs md:text-sm font-medium text-slate-600">Team Payments</h3>
                  <ArrowDownLeft className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
                </div>
                <div className="flex-1 flex items-center">
                  <div className="text-2xl md:text-3xl font-bold text-red-700">
                    {formatCurrency(monthlyTeamPayments)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expenses */}
          <Card className="bg-gradient-to-br from-orange-100/80 to-orange-200/80 backdrop-blur-sm border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden">
            <CardContent className="p-4 md:p-6 relative">
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xs md:text-sm font-medium text-slate-600">Expenses</h3>
                  <TrendingDown className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
                </div>
                <div className="flex-1 flex items-center">
                  <div className="text-2xl md:text-3xl font-bold text-orange-700">
                    {formatCurrency(monthlyExpenses)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-white/90 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg shadow-blue-500/5 p-4 sm:p-6 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 group/search">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within/search:text-blue-600 transition-colors" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/50 border-white/30 focus:bg-white/90 focus:border-blue-300 transition-all duration-200 hover:bg-white/70"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant={periodFilter === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriodFilter("week")}
                className={`transition-all duration-200 ${periodFilter === "week" 
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md" 
                  : "bg-white/50 border-white/30 hover:bg-white/80 hover:scale-105"
                }`}
              >
                Week
              </Button>
              <Button 
                variant={periodFilter === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriodFilter("month")}
                className={`transition-all duration-200 ${periodFilter === "month" 
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md" 
                  : "bg-white/50 border-white/30 hover:bg-white/80 hover:scale-105"
                }`}
              >
                Month
              </Button>
              <Button 
                variant={periodFilter === "year" ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriodFilter("year")}
                className={`transition-all duration-200 ${periodFilter === "year" 
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md" 
                  : "bg-white/50 border-white/30 hover:bg-white/80 hover:scale-105"
                }`}
              >
                Year
              </Button>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <Card className="bg-white/90 backdrop-blur-sm border border-white/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Recent Transactions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.length > 0 ? transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-white/50 rounded-lg border border-white/30">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${transaction.type === 'incoming' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {transaction.type === 'incoming' ? (
                        <ArrowUpRight className={`w-4 h-4 ${transaction.type === 'incoming' ? 'text-green-600' : 'text-red-600'}`} />
                      ) : (
                        <ArrowDownLeft className={`w-4 h-4 ${transaction.type === 'incoming' ? 'text-green-600' : 'text-red-600'}`} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{transaction.description}</p>
                      <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <span>{transaction.client}</span>
                        {transaction.teamMember && (
                          <>
                            <span>•</span>
                            <span>Paid to {transaction.teamMember}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-xs text-slate-500">{format(transaction.date, 'MMM dd, yyyy')}</p>
                        {transaction.category && (
                          <>
                            <span className="text-xs text-slate-400">•</span>
                            <Badge variant="outline" className="text-xs px-2 py-0.5">
                              {transaction.category}
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className={`text-lg font-bold ${transaction.type === 'incoming' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'incoming' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                      <Badge 
                        variant="secondary" 
                        className={`${transaction.type === 'incoming' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                      >
                        {transaction.type === 'incoming' ? 'Income' : 'Payment'}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      {/* Edit button for all transactions */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setShowEditModal(true);
                        }}
                        className="h-8 w-8 p-0 hover:bg-white/50"
                        title="Edit transaction"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      {/* Delete button only for manual transactions */}
                      {!transaction.isClientPayment && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this transaction?')) {
                              deleteTransactionMutation.mutate(transaction.id);
                            }
                          }}
                          className="h-8 w-8 p-0 hover:bg-red-50 text-red-600"
                          title="Delete transaction"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-slate-500">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-medium">No transactions yet</p>
                  <p>Transactions will appear here when clients make payments</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Clients by Revenue */}
        <Card className="bg-white/90 backdrop-blur-sm border border-white/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              Top Clients by Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clients.length > 0 ? clients
                .sort((a, b) => parseFloat(b.amountPaidUSD?.toString() || b.amountPaid.toString()) - parseFloat(a.amountPaidUSD?.toString() || a.amountPaid.toString()))
                .slice(0, 5)
                .map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-sm rounded-lg border border-white/30 hover:bg-white/70 transition-all">
                    <span className="font-medium text-slate-900">{client.name}</span>
                    <span className="text-blue-600 font-bold">
                      {formatCurrency(parseFloat(client.amountPaidUSD?.toString() || client.amountPaid.toString()))}
                    </span>
                  </div>
                )) : (
                <div className="text-center py-8 text-slate-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-medium">No client revenue yet</p>
                  <p>Revenue data will appear here when clients make payments</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <ManualTransactionModal 
          open={showTransactionModal}
          onOpenChange={setShowTransactionModal}
        />
        
        <TransactionEditModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          transaction={selectedTransaction}
        />
      </div>
    </div>
  );
}