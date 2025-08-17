import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Star, MessageSquare } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface CourseRatingProps {
  courseId: string;
  courseName: string;
}

interface Rating {
  id: string;
  courseId: string;
  rating: number;
  review: string;
  userName: string;
  date: string;
}

export default function CourseRating({ courseId, courseName }: CourseRatingProps) {
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState('');
  const [hasRated, setHasRated] = useState(false);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    loadRatings();
  }, [courseId]);

  const loadRatings = () => {
    // Load ratings from localStorage (in a real app, this would be from a database)
    const storedRatings = JSON.parse(localStorage.getItem('courseRatings') || '[]');
    const courseRatings = storedRatings.filter((r: Rating) => r.courseId === courseId);
    setRatings(courseRatings);

    if (courseRatings.length > 0) {
      const avg = courseRatings.reduce((sum: number, r: Rating) => sum + r.rating, 0) / courseRatings.length;
      setAverageRating(avg);
    }

    // Check if current user has already rated
    const userRatingData = JSON.parse(localStorage.getItem('userCourseRating') || '{}');
    if (userRatingData[courseId]) {
      setHasRated(true);
      setUserRating(userRatingData[courseId].rating);
      setUserReview(userRatingData[courseId].review);
    }
  };

  const handleRatingClick = (rating: number) => {
    if (!hasRated) {
      setUserRating(rating);
      setShowReviewForm(true);
    }
  };

  const submitRating = () => {
    if (userRating === 0) {
      toast({
        title: "Please select a rating",
        variant: "destructive"
      });
      return;
    }

    const newRating: Rating = {
      id: Date.now().toString(),
      courseId,
      rating: userRating,
      review: userReview,
      userName: 'Anonymous User', // In a real app, this would be the actual user name
      date: new Date().toISOString()
    };

    // Save to localStorage
    const storedRatings = JSON.parse(localStorage.getItem('courseRatings') || '[]');
    storedRatings.push(newRating);
    localStorage.setItem('courseRatings', JSON.stringify(storedRatings));

    // Save user's rating
    const userRatings = JSON.parse(localStorage.getItem('userCourseRating') || '{}');
    userRatings[courseId] = { rating: userRating, review: userReview };
    localStorage.setItem('userCourseRating', JSON.stringify(userRatings));

    setHasRated(true);
    setShowReviewForm(false);
    loadRatings();

    toast({
      title: "Thank you for your feedback!",
      description: "Your rating has been submitted successfully"
    });
  };

  const renderStars = (rating: number, interactive: boolean = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && handleRatingClick(star)}
            disabled={!interactive || hasRated}
            className={`${interactive && !hasRated ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            <Star
              className={`h-5 w-5 ${
                star <= rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Overall Rating */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Course Rating
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ratings.length > 0 ? (
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold">{averageRating.toFixed(1)}</div>
              {renderStars(Math.round(averageRating))}
              <Badge variant="secondary">
                {ratings.length} review{ratings.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          ) : (
            <p className="text-muted-foreground">No ratings yet. Be the first to rate this course!</p>
          )}
        </CardContent>
      </Card>

      {/* User Rating Form */}
      {!hasRated && (
        <Card>
          <CardHeader>
            <CardTitle>Rate This Course</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                How would you rate "{courseName}"?
              </p>
              {renderStars(userRating, true)}
            </div>

            {showReviewForm && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Write a review (optional)
                  </label>
                  <Textarea
                    value={userReview}
                    onChange={(e) => setUserReview(e.target.value)}
                    placeholder="Share your thoughts about this course..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={submitRating}>Submit Rating</Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowReviewForm(false);
                      setUserRating(0);
                      setUserReview('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* User's Rating (if already rated) */}
      {hasRated && (
        <Card>
          <CardHeader>
            <CardTitle>Your Rating</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {renderStars(userRating)}
            {userReview && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm">{userReview}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reviews */}
      {ratings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Reviews
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ratings
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((rating) => (
                <div key={rating.id} className="border-b pb-4 last:border-b-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="font-medium text-sm">{rating.userName}</div>
                    {renderStars(rating.rating)}
                    <div className="text-xs text-muted-foreground">
                      {new Date(rating.date).toLocaleDateString()}
                    </div>
                  </div>
                  {rating.review && (
                    <p className="text-sm text-muted-foreground">{rating.review}</p>
                  )}
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}