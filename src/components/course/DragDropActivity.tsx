import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react';

interface DragItem {
  id: string;
  content: string;
  category: string;
}

interface DropZone {
  id: string;
  label: string;
  category: string;
  items: DragItem[];
}

interface DragDropActivityProps {
  title: string;
  instructions: string;
  items: DragItem[];
  zones: Omit<DropZone, 'items'>[];
  onComplete: (score: number) => void;
  className?: string;
}

export default function DragDropActivity({
  title,
  instructions,
  items,
  zones,
  onComplete,
  className
}: DragDropActivityProps) {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [dropZones, setDropZones] = useState<DropZone[]>(
    zones.map(zone => ({ ...zone, items: [] }))
  );
  const [availableItems, setAvailableItems] = useState<DragItem[]>(items);
  const [isComplete, setIsComplete] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const handleDragStart = (item: DragItem) => {
    setDraggedItem(item);
  };

  const handleDrop = (zoneId: string) => {
    if (!draggedItem) return;

    // Remove item from its current location
    setAvailableItems(prev => prev.filter(item => item.id !== draggedItem.id));
    setDropZones(prev => prev.map(zone => ({
      ...zone,
      items: zone.items.filter(item => item.id !== draggedItem.id)
    })));

    // Add item to new zone
    setDropZones(prev => prev.map(zone => 
      zone.id === zoneId 
        ? { ...zone, items: [...zone.items, draggedItem] }
        : zone
    ));

    setDraggedItem(null);
  };

  const handleReturnToPool = (item: DragItem) => {
    // Remove from drop zone
    setDropZones(prev => prev.map(zone => ({
      ...zone,
      items: zone.items.filter(i => i.id !== item.id)
    })));

    // Add back to available items
    setAvailableItems(prev => [...prev, item]);
  };

  const checkAnswers = () => {
    let correct = 0;
    let total = 0;

    dropZones.forEach(zone => {
      zone.items.forEach(item => {
        total++;
        if (item.category === zone.category) {
          correct++;
        }
      });
    });

    const finalScore = total > 0 ? Math.round((correct / total) * 100) : 0;
    setScore(finalScore);
    setIsComplete(true);
    onComplete(finalScore);
  };

  const reset = () => {
    setAvailableItems(items);
    setDropZones(zones.map(zone => ({ ...zone, items: [] })));
    setIsComplete(false);
    setScore(null);
    setDraggedItem(null);
  };

  const allItemsPlaced = availableItems.length === 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          {isComplete && score !== null && (
            <Badge variant={score >= 70 ? "default" : "destructive"}>
              Score: {score}%
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{instructions}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Available Items */}
        {!isComplete && availableItems.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Drag these items:</h4>
            <div className="flex flex-wrap gap-2">
              {availableItems.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(item)}
                  className="px-3 py-2 bg-primary text-primary-foreground rounded-md cursor-grab hover:bg-primary/90 transition-colors text-sm"
                >
                  {item.content}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Drop Zones */}
        <div className="grid gap-4 md:grid-cols-2">
          {dropZones.map((zone) => (
            <div
              key={zone.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(zone.id)}
              className={`min-h-24 p-4 border-2 border-dashed rounded-lg transition-colors ${
                draggedItem 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border bg-muted/30'
              }`}
            >
              <h4 className="font-medium mb-2">{zone.label}</h4>
              <div className="space-y-2">
                {zone.items.map((item) => (
                  <div
                    key={item.id}
                    className={`px-3 py-2 rounded-md text-sm flex items-center justify-between ${
                      isComplete
                        ? item.category === zone.category
                          ? 'bg-success/20 text-success-foreground border border-success'
                          : 'bg-destructive/20 text-destructive-foreground border border-destructive'
                        : 'bg-background border'
                    }`}
                  >
                    <span>{item.content}</span>
                    {isComplete && (
                      item.category === zone.category 
                        ? <CheckCircle className="h-4 w-4 text-success" />
                        : <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    {!isComplete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReturnToPool(item)}
                        className="h-6 w-6 p-0"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
                {zone.items.length === 0 && (
                  <div className="text-muted-foreground text-sm italic">
                    Drop items here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          {!isComplete && (
            <Button
              onClick={checkAnswers}
              disabled={!allItemsPlaced}
              className="min-w-32"
            >
              Check Answers
            </Button>
          )}
          {isComplete && (
            <Button onClick={reset} variant="outline" className="min-w-32">
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}