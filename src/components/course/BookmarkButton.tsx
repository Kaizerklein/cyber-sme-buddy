import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface BookmarkButtonProps {
  courseId: string;
  className?: string;
}

export default function BookmarkButton({ courseId, className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load bookmark status from localStorage
    const bookmarks = JSON.parse(localStorage.getItem('courseBookmarks') || '[]');
    setIsBookmarked(bookmarks.includes(courseId));
  }, [courseId]);

  const toggleBookmark = async () => {
    setLoading(true);
    try {
      const bookmarks = JSON.parse(localStorage.getItem('courseBookmarks') || '[]');
      
      if (isBookmarked) {
        // Remove bookmark
        const updatedBookmarks = bookmarks.filter((id: string) => id !== courseId);
        localStorage.setItem('courseBookmarks', JSON.stringify(updatedBookmarks));
        setIsBookmarked(false);
        toast({
          title: "Bookmark Removed",
          description: "Course removed from your bookmarks"
        });
      } else {
        // Add bookmark
        const updatedBookmarks = [...bookmarks, courseId];
        localStorage.setItem('courseBookmarks', JSON.stringify(updatedBookmarks));
        setIsBookmarked(true);
        toast({
          title: "Course Bookmarked",
          description: "Course added to your bookmarks"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update bookmark",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleBookmark}
      disabled={loading}
      className={className}
    >
      {isBookmarked ? (
        <BookmarkCheck className="h-4 w-4" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
      {isBookmarked ? 'Bookmarked' : 'Bookmark'}
    </Button>
  );
}