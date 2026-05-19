import { useTrades } from '../hooks/useTrades';
import CalendarView from '../components/Dashboard/CalendarView';
import StatsWidgets from '../components/Dashboard/StatsWidgets';
import ZellaScore from '../components/Dashboard/ZellaScore';
import Loader from '../components/shared/Loader';

const Dashboard = () => {
  const { trades, loading } = useTrades();

  if (loading) return <Loader />;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="p-6 min-h-screen bg-[#0f0f0f]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">{greeting}! 👋</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex gap-5">
        {/* Calendar - Left */}
        <CalendarView trades={trades} />

        {/* Widgets - Right */}
        <div className="w-72 space-y-3 flex-shrink-0">
          <StatsWidgets trades={trades} />
          <ZellaScore trades={trades} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;