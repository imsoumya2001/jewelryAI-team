import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mapPins } from "@/lib/data";
import { MapPin } from "@/types";

export default function WorldMap() {
  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Client Distribution</CardTitle>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">47 clients across</span>
            <Badge variant="secondary" className="bg-jewelry-blue text-white">
              12 countries
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative h-80 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg overflow-hidden">
          {/* Simplified world map background */}
          <div className="absolute inset-0">
            <svg 
              viewBox="0 0 1000 500" 
              className="w-full h-full opacity-20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="1000" height="500" fill="#f8fafc"/>
              <path d="M200,200 Q300,150 400,200 T600,180 Q700,160 800,200 Q850,220 900,200" stroke="#e2e8f0" strokeWidth="2" fill="none"/>
              <path d="M150,300 Q250,250 350,300 T550,280 Q650,260 750,300" stroke="#e2e8f0" strokeWidth="2" fill="none"/>
              {/* Simplified continent shapes */}
              <ellipse cx="200" cy="180" rx="80" ry="60" fill="#e2e8f0" opacity="0.5"/>
              <ellipse cx="500" cy="150" rx="100" ry="50" fill="#e2e8f0" opacity="0.5"/>
              <ellipse cx="750" cy="200" rx="120" ry="80" fill="#e2e8f0" opacity="0.5"/>
              <ellipse cx="600" cy="280" rx="60" ry="40" fill="#e2e8f0" opacity="0.5"/>
              <ellipse cx="800" cy="350" rx="40" ry="30" fill="#e2e8f0" opacity="0.5"/>
            </svg>
          </div>

          {/* Client pins */}
          {mapPins.map((pin) => (
            <div
              key={pin.id}
              className="absolute group cursor-pointer"
              style={{ 
                top: pin.position.top, 
                left: pin.position.left,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className={`w-8 h-8 ${pin.color} rounded-full border-2 border-white shadow-lg hover:scale-110 transition-transform flex items-center justify-center`}>
                <span className="text-white text-xs font-bold">{pin.clientCount}</span>
              </div>
              
              {/* Tooltip */}
              <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white p-3 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                <p className="font-semibold text-sm">{pin.region}</p>
                <p className="text-xs text-gray-600">
                  {pin.clientCount} clients • ${Math.round(pin.revenue / 1000)}K revenue
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
