import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Focus Planning - Team Capacity Management',
  description: 'Manage team capacity and planning with Azure DevOps integration',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="min-h-screen bg-gray-50">
          <nav className="bg-blue-600 text-white shadow-lg">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold">Focus Planning</h1>
                </div>
                <div className="flex space-x-6">
                  <a href="/" className="hover:text-blue-100 transition-colors">
                    Dashboard
                  </a>
                  <a href="/teams" className="hover:text-blue-100 transition-colors">
                    Teams
                  </a>
                  <a href="/focus-periods" className="hover:text-blue-100 transition-colors">
                    Focus Periods
                  </a>
                  <a href="/work-items" className="hover:text-blue-100 transition-colors">
                    Work Items
                  </a>
                  <a href="/capacity" className="hover:text-blue-100 transition-colors">
                    Capacity
                  </a>
                </div>
              </div>
            </div>
          </nav>
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
