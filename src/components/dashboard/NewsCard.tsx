import { Newspaper, ExternalLink } from 'lucide-react';

const newsItems = [
  {
    title: 'Tech Innovation Continues to Transform Daily Life',
    source: 'TechNews',
    time: '2h ago',
  },
  {
    title: 'New Study Reveals Benefits of Morning Routines',
    source: 'Wellness Daily',
    time: '4h ago',
  },
  {
    title: 'Local Community Events This Weekend',
    source: 'City Updates',
    time: '5h ago',
  },
];

export function NewsCard() {
  return (
    <div className="p-5 rounded-xl bg-card border border-border/50 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">Today's Headlines</h3>
      </div>
      <div className="space-y-3">
        {newsItems.map((item, index) => (
          <div 
            key={index}
            className="group p-3 rounded-lg hover:bg-secondary/30 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors">
                {item.title}
              </p>
              <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {item.source} · {item.time}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
