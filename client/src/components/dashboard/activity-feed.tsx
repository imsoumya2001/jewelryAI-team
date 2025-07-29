import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Activity, ClientWithTeam } from "@shared/schema";

export default function ActivityFeed() {
  const { data: clients = [] } = useQuery<ClientWithTeam[]>({
    queryKey: ["/api/clients"],
  });

  const { data: allActivities = [] } = useQuery<(Activity & { clientName: string })[]>({
    queryKey: ["/api/activities"],
  });

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'completed':
        return 'bg-green-500';
      case 'payment':
        return 'bg-blue-500';
      case 'meeting':
        return 'bg-orange-500';
      case 'proposal':
        return 'bg-purple-500';
      case 'urgent':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTimeAgo = (date: Date | string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInMs = now.getTime() - past.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {allActivities.length > 0 ? allActivities.slice(0, 8).map((activity) => (
            <div key={`${activity.clientId}-${activity.id}`} className="flex items-start space-x-3">
              <div className={`w-2 h-2 ${getActivityColor(activity.type)} rounded-full mt-2 flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{activity.clientName}</p>
                <p className="text-xs text-gray-600">{activity.description}</p>
                <p className="text-xs text-gray-400 mt-1">{getTimeAgo(activity.createdAt)}</p>
              </div>
            </div>
          )) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">No recent activities</p>
            </div>
          )}
        </div>
        <Button 
          variant="ghost" 
          className="w-full mt-4 text-jewelry-blue hover:text-jewelry-purple text-sm font-medium"
        >
          View all activities <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
