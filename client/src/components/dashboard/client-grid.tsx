import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ClientWithTeam } from "@shared/schema";
import { countries, statusColors } from "@/lib/data";
import { useMemo, useState } from "react";
import ClientDetailModal from "@/components/client-detail-modal";

interface ClientGridProps {
  searchQuery: string;
  statusFilter: string;
  viewMode: "grid" | "list";
}

export default function ClientGrid({ searchQuery, statusFilter, viewMode }: ClientGridProps) {
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const { data: clients = [], isLoading } = useQuery<ClientWithTeam[]>({
    queryKey: ["/api/clients"],
  });

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch = !searchQuery || 
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.country.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || 
        client.projectStatus.toLowerCase().replace(" ", "-") === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [clients, searchQuery, statusFilter]);

  const getClientInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getCountryFlag = (countryCode: string) => {
    return countries[countryCode]?.flag || '';
  };

  const getCountryName = (countryCode: string) => {
    return countries[countryCode]?.name || countryCode;
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getTimeAgo = (date: Date | string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInMs = now.getTime() - past.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const handleClientClick = (clientId: number) => {
    setSelectedClientId(clientId);
    setDetailModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (filteredClients.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No clients found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"}`}>
        {filteredClients.map((client) => {
          const statusStyle = statusColors[client.projectStatus] || statusColors['In Progress'];
          const assignedTeamMember = client.assignments?.[0]?.teamMember;
          const totalFee = parseFloat(client.totalProjectFee.toString());
          const amountPaid = parseFloat(client.amountPaid.toString());
          const isPaidInFull = amountPaid >= totalFee;

          return (
            <Card 
              key={client.id} 
              className="border border-gray-200 hover:shadow-card-hover transition-shadow cursor-pointer group"
              onClick={() => handleClientClick(client.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {/* Company Logo or Initial */}
                    {client.logoUrl ? (
                      <img 
                        src={client.logoUrl} 
                        alt={`${client.name} logo`}
                        className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                        {getClientInitials(client.name)}
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-gray-900">{client.name}</h4>
                      <div className="flex items-center space-x-1 mt-1">
                        <img 
                          src={getCountryFlag(client.countryCode)} 
                          alt={`${client.country} Flag`} 
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-xs text-gray-500">{getCountryName(client.countryCode)}</span>
                      </div>
                    </div>
                  </div>
                  <Badge 
                    className={`${statusStyle.bg} ${statusStyle.text} text-xs px-2 py-1 rounded-full font-medium`}
                  >
                    {client.projectStatus}
                  </Badge>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{client.progressPercentage}%</span>
                  </div>
                  <Progress value={client.progressPercentage} className="h-2" />
                </div>

                <div className="flex items-center justify-between text-sm mb-4">
                  <div>
                    <p className="text-gray-600">Project Fee</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(totalFee)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600">Paid</p>
                    <p className={`font-semibold ${isPaidInFull ? 'text-green-600' : 'text-orange-600'}`}>
                      {formatCurrency(amountPaid)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {assignedTeamMember ? (
                      <>
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={assignedTeamMember.avatar || ''} alt={assignedTeamMember.name} />
                          <AvatarFallback className="text-xs">
                            {getClientInitials(assignedTeamMember.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-600">{assignedTeamMember.name}</span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">No team member assigned</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {getTimeAgo(client.lastActivity)}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Load More Button */}
      <div className="text-center mt-8">
        <Button variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-700">
          Load More Clients <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
      
      <ClientDetailModal
        clientId={selectedClientId}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />
    </div>
  );
}
