import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0f0f0f]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};
//hello
export default Layout;