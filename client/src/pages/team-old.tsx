import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Users, Calendar, DollarSign, Edit, Upload } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { TeamMember } from "@shared/schema";
import TeamMemberFormModal from "@/components/team-member-form-modal";
import { format } from "date-fns";

export default function TeamPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMemberDetails, setShowMemberDetails] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  const { data: teamMembers = [], isLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  const { data: transactions = [] } = useQuery<any[]>({
    queryKey: ["/api/transactions"],
  });

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate team earnings from transactions
  const totalEarnings = transactions
    .filter(t => t.type === 'payment_to_team' && t.teamMemberId)
    .reduce((sum, t) => sum + parseFloat(t.amountUSD || t.amount), 0);

  // Calculate real project count from client assignments
  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ["/api/clients"],
  });
  
  const activeProjectsCount = clients.filter(c => c.status === 'active' || c.status === 'in-progress').length;

  // Calculate individual team member metrics
  const getTeamMemberMetrics = (memberId: number) => {
    const memberTransactions = transactions.filter(t => t.teamMemberId === memberId);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Current month earnings
    const monthlyEarnings = memberTransactions
      .filter(t => {
        const transactionDate = new Date(t.date || t.createdAt);
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear &&
               (t.type === 'payment_to_team' || t.type === 'salary');
      })
      .reduce((sum, t) => sum + parseFloat(t.amountUSD || t.amount), 0);
    
    // Last earning date
    const lastEarningTransaction = memberTransactions
      .filter(t => t.type === 'payment_to_team' || t.type === 'salary')
      .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime())[0];
    
    const lastEarningDate = lastEarningTransaction ? new Date(lastEarningTransaction.date || lastEarningTransaction.createdAt) : null;
    
    return {
      monthlyEarnings,
      lastEarningDate,
      memberTransactions
    };
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="p-6 space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-white/40 rounded-lg w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-48 bg-white/40 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              Team Management
            </h1>
            <p className="text-slate-600 mt-1">Manage your team members and their assignments</p>
          </div>
          <Button 
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Team Member
          </Button>
        </div>

        {/* Search */}
        <div className="flex justify-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/70 backdrop-blur-sm border-white/20 focus:bg-white/90 transition-all duration-200"
            />
          </div>
        </div>

        {/* Team Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => {
            const metrics = getTeamMemberMetrics(member.id);
            return (
              <Card 
                key={member.id} 
                className="bg-white/60 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
                onClick={() => {
                  setSelectedMember(member);
                  setShowMemberDetails(true);
                }}
              >
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="relative">
                      <Avatar className="w-20 h-20 mx-auto border-4 border-white shadow-lg">
                        <AvatarImage src={member.avatar || ''} alt={member.name} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-bold">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute -top-2 -right-2 h-8 w-8 p-0 bg-white/80 hover:bg-white shadow-md"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingMember(member);
                          setShowAddModal(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">{member.name}</h3>
                      <p className="text-slate-500 text-sm">{member.country}</p>
                    </div>
                    
                    <Badge 
                      variant="secondary" 
                      className="bg-gradient-to-r from-blue-100 to-purple-100 text-slate-700 border-0"
                    >
                      {member.role}
                    </Badge>
                    
                    <div className="space-y-2 text-center">
                      <div>
                        <p className="text-2xl font-bold text-green-600">${metrics.monthlyEarnings.toFixed(0)}</p>
                        <p className="text-xs text-slate-600">Earning This Month</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">
                          Last Earning: {metrics.lastEarningDate ? format(metrics.lastEarningDate, 'MMM dd, yyyy') : 'No earnings yet'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty state */}
        {teamMembers.length === 0 && (
          <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-lg">
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No team members yet</h3>
              <p className="text-slate-500 mb-6">Add your first team member to get started with project assignments and financial tracking</p>
              <Button 
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Team Member
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Team Member Details Modal */}
        <Dialog open={showMemberDetails} onOpenChange={setShowMemberDetails}>
          <DialogContent className="sm:max-w-4xl bg-white/90 backdrop-blur-xl border-white/20">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                {selectedMember?.name} - Transaction History
              </DialogTitle>
            </DialogHeader>
            
            {selectedMember && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <Avatar className="w-16 h-16 border-4 border-white shadow-lg">
                    <AvatarImage src={selectedMember.avatar || ''} alt={selectedMember.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-bold">
                      {getInitials(selectedMember.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">{selectedMember.name}</h3>
                    <p className="text-slate-600">{selectedMember.role}</p>
                    <p className="text-slate-500">{selectedMember.country}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-white/20 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-50 to-blue-50">
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getTeamMemberMetrics(selectedMember.id).memberTransactions.length > 0 ? (
                        getTeamMemberMetrics(selectedMember.id).memberTransactions
                          .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime())
                          .map((transaction) => (
                            <TableRow key={transaction.id} className="hover:bg-white/50">
                              <TableCell>{format(new Date(transaction.date || transaction.createdAt), 'MMM dd, yyyy')}</TableCell>
                              <TableCell>
                                <Badge variant={transaction.type === 'salary' || transaction.type === 'payment_to_team' ? 'default' : 'secondary'}>
                                  {transaction.type}
                                </Badge>
                              </TableCell>
                              <TableCell>{transaction.description || 'No description'}</TableCell>
                              <TableCell className="font-semibold text-green-600">
                                ${parseFloat(transaction.amountUSD || transaction.amount).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                            No transactions found for this team member
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <TeamMemberFormModal 
          open={showAddModal}
          onOpenChange={setShowAddModal}
        />
      </div>
  );
}
                  </Avatar>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">{member.name}</h3>
                    <p className="text-slate-600">{member.whatsappNo}</p>
                    <p className="text-slate-500 text-sm">{member.country}</p>
                  </div>
                  
                  <Badge 
                    variant="secondary" 
                    className="bg-gradient-to-r from-blue-100 to-purple-100 text-slate-700 border-0"
                  >
                    {member.role}
                  </Badge>
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{getTeamMemberMetrics(member.id).activeProjects}</p>
                      <p className="text-xs text-slate-600">Active Projects</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">${Math.round(getTeamMemberMetrics(member.id).earnings).toLocaleString()}</p>
                      <p className="text-xs text-slate-600">Total Earnings</p>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full bg-white/50 border-white/30 hover:bg-white/80 transition-all duration-200"
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty state */}
        {teamMembers.length === 0 && (
          <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-lg">
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No team members yet</h3>
              <p className="text-slate-500 mb-6">Add your first team member to get started with project assignments and financial tracking</p>
              <Button 
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Team Member
              </Button>
            </CardContent>
          </Card>
        )}

        <TeamMemberFormModal 
          open={showAddModal}
          onOpenChange={setShowAddModal}
        />
      </div>
  );
}