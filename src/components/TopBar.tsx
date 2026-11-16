export type ActiveTab = 'overview' | 'interview' | 'photos' | 'layout';

interface TopBarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onStartRecording: () => void;
}

const NAV_ITEMS: Array<{ id: ActiveTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'interview', label: 'Interview Studio' },
  { id: 'photos', label: 'Photo Stories' },
  { id: 'layout', label: 'Book Layout' },
];

export function TopBar({ activeTab, onSelectTab, onStartRecording }: TopBarProps) {
  return (
    <header className="no-print sticky top-0 z-30 bg-[#FAF9F6]/95 backdrop-blur-sm border-b border-[#E4E2DD]">
      <div className="max-w-[1360px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
        <button
          type="button"
          onClick={() => onSelectTab('overview')}
          className="font-editorial text-xl font-semibold tracking-tight text-[#18181B] whitespace-nowrap shrink-0 cursor-pointer hover:text-[#1B4332] transition-colors"
        >
          Remember Press
        </button>

        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#57534E]"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`whitespace-nowrap shrink-0 py-1 cursor-pointer transition-colors border-b-2 ${
                  isActive
                    ? 'text-[#18181B] border-[#1B4332]'
                    : 'border-transparent hover:text-[#18181B] hover:border-[#D6D3CD]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onStartRecording}
            className="px-4 py-2 text-sm font-medium text-white bg-[#1B4332] rounded-lg hover:bg-[#143326] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Record Story
          </button>
        </div>
      </div>

      {/* Compact mobile navigation row */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden flex items-center gap-5 px-6 pb-2.5 overflow-x-auto text-xs font-medium text-[#57534E] border-t border-[#EFECE6]"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`whitespace-nowrap shrink-0 pt-2 pb-1 border-b-2 ${
                isActive ? 'text-[#18181B] border-[#1B4332]' : 'border-transparent'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
