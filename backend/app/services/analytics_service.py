"""
Analytics Tracking Service
Tracks all user interactions with URLs and games
"""
from typing import Optional, Dict, List, Any
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, case

from app.models.analytics import URLAnalytics
from app.models.url import ShortURL
from app.models.leaderboard import LeaderboardEntry


class AnalyticsService:
    """Service for tracking and retrieving analytics data"""

    @staticmethod
    def start_session(
        short_code: str,
        visitor_ip: str,
        visitor_user_agent: str,
        referrer: Optional[str],
        db: Session
    ) -> Optional[int]:
        """
        Start a new analytics session when URL is accessed

        Args:
            short_code: Short URL code
            visitor_ip: Visitor's IP address
            visitor_user_agent: Visitor's user agent
            referrer: HTTP referrer
            db: Database session

        Returns:
            Session ID if successful, None otherwise
        """
        try:
            # Increment view count on URL
            url = db.query(ShortURL).filter(ShortURL.short_code == short_code).first()
            if url:
                url.total_views += 1

            # Create analytics session
            session = URLAnalytics(
                short_code=short_code,
                visitor_ip=visitor_ip,
                visitor_user_agent=visitor_user_agent,
                referrer=referrer,
                session_start=datetime.utcnow()
            )

            db.add(session)
            db.commit()
            db.refresh(session)

            print(f"[ANALYTICS] Session started: {session.id} for {short_code}")
            return session.id

        except Exception as e:
            print(f"[ANALYTICS] Error starting session: {str(e)}")
            db.rollback()
            return None

    @staticmethod
    def track_completion(
        session_id: int,
        completion_time: int,
        hints_used: int,
        attempts: int,
        score: int,
        db: Session
    ) -> None:
        """
        Track game completion

        Args:
            session_id: Analytics session ID
            completion_time: Time taken in seconds
            hints_used: Number of hints used
            attempts: Number of attempts
            score: Final score
            db: Database session
        """
        try:
            session = db.query(URLAnalytics).filter(URLAnalytics.id == session_id).first()

            if session:
                session.outcome = 'completed'
                session.session_end = datetime.utcnow()
                session.completion_time = completion_time
                session.hints_used = hints_used
                session.attempts = attempts
                session.score = score

                db.commit()

                print(f"[ANALYTICS] Completion tracked for session {session_id}")

                # Update summary statistics
                AnalyticsService._update_summary_stats(session.short_code, db)

        except Exception as e:
            print(f"[ANALYTICS] Error tracking completion: {str(e)}")
            db.rollback()

    @staticmethod
    def track_failure(
        session_id: int,
        attempts: int,
        hints_used: int,
        score: int,
        db: Session
    ) -> None:
        """
        Track game failure (wrong answer)

        Args:
            session_id: Analytics session ID
            attempts: Number of attempts
            hints_used: Number of hints used
            score: Final score
            db: Database session
        """
        try:
            session = db.query(URLAnalytics).filter(URLAnalytics.id == session_id).first()

            if session:
                session.outcome = 'failed'
                session.session_end = datetime.utcnow()
                session.attempts = attempts
                session.hints_used = hints_used
                session.score = score

                db.commit()

                print(f"[ANALYTICS] Failure tracked for session {session_id}")

                # Update summary
                AnalyticsService._update_summary_stats(session.short_code, db)

        except Exception as e:
            print(f"[ANALYTICS] Error tracking failure: {str(e)}")
            db.rollback()

    @staticmethod
    def track_timeout(
        session_id: int,
        attempts: int,
        hints_used: int,
        score: int,
        db: Session
    ) -> None:
        """
        Track game timeout

        Args:
            session_id: Analytics session ID
            attempts: Number of attempts
            hints_used: Number of hints used
            score: Final score
            db: Database session
        """
        try:
            session = db.query(URLAnalytics).filter(URLAnalytics.id == session_id).first()

            if session:
                session.outcome = 'timeout'
                session.session_end = datetime.utcnow()
                session.attempts = attempts
                session.hints_used = hints_used
                session.score = score

                db.commit()

                print(f"[ANALYTICS] Timeout tracked for session {session_id}")

                # Update summary
                AnalyticsService._update_summary_stats(session.short_code, db)

        except Exception as e:
            print(f"[ANALYTICS] Error tracking timeout: {str(e)}")
            db.rollback()

    @staticmethod
    def track_abandonment(session_id: int, db: Session) -> None:
        """
        Track game abandonment (user left before completing)

        Args:
            session_id: Analytics session ID
            db: Database session
        """
        try:
            session = db.query(URLAnalytics).filter(
                URLAnalytics.id == session_id,
                URLAnalytics.outcome == None
            ).first()

            if session:
                session.outcome = 'abandoned'
                session.session_end = datetime.utcnow()

                db.commit()

                print(f"[ANALYTICS] Abandonment tracked for session {session_id}")

        except Exception as e:
            print(f"[ANALYTICS] Error tracking abandonment: {str(e)}")
            db.rollback()

    @staticmethod
    def track_ad_impression(session_id: int, placement_type: str, db: Session) -> None:
        """
        Track ad impression

        Args:
            session_id: Analytics session ID
            placement_type: Ad placement type
            db: Database session
        """
        try:
            session = db.query(URLAnalytics).filter(URLAnalytics.id == session_id).first()

            if session:
                session.ads_shown = (session.ads_shown or 0) + 1
                db.commit()

                print(f"[ANALYTICS] Ad impression: {placement_type} for session {session_id}")

        except Exception as e:
            print(f"[ANALYTICS] Error tracking ad impression: {str(e)}")
            db.rollback()

    @staticmethod
    def track_ad_click(
        session_id: int,
        placement_type: str,
        estimated_revenue: float,
        db: Session
    ) -> None:
        """
        Track ad click

        Args:
            session_id: Analytics session ID
            placement_type: Ad placement type
            estimated_revenue: Estimated revenue from click
            db: Database session
        """
        try:
            session = db.query(URLAnalytics).filter(URLAnalytics.id == session_id).first()

            if session:
                session.ads_clicked = (session.ads_clicked or 0) + 1
                session.estimated_revenue = (session.estimated_revenue or 0) + estimated_revenue
                db.commit()

                print(f"[ANALYTICS] Ad click: {placement_type} (${estimated_revenue}) for session {session_id}")

        except Exception as e:
            print(f"[ANALYTICS] Error tracking ad click: {str(e)}")
            db.rollback()

    @staticmethod
    def get_analytics_summary(short_code: str, db: Session) -> Dict[str, Any]:
        """
        Get analytics summary for a short code

        Args:
            short_code: Short URL code
            db: Database session

        Returns:
            Analytics summary dictionary
        """
        try:
            url = db.query(ShortURL).filter(ShortURL.short_code == short_code).first()

            if not url:
                return {}

            # Calculate completion rate
            completion_rate = 0
            if url.total_views > 0:
                completion_rate = (url.total_completions / url.total_views) * 100

            return {
                'total_views': url.total_views,
                'total_completions': url.total_completions,
                'total_failures': url.total_failures,
                'total_timeouts': url.total_timeouts,
                'avg_completion_time': url.avg_completion_time,
                'completion_rate': completion_rate
            }

        except Exception as e:
            print(f"[ANALYTICS] Error getting summary: {str(e)}")
            return {}

    @staticmethod
    def get_detailed_analytics(short_code: str, limit: int, db: Session) -> List[URLAnalytics]:
        """
        Get detailed analytics for a short code

        Args:
            short_code: Short URL code
            limit: Number of sessions to return
            db: Database session

        Returns:
            List of analytics sessions
        """
        try:
            sessions = db.query(URLAnalytics)\
                .filter(URLAnalytics.short_code == short_code)\
                .order_by(desc(URLAnalytics.session_start))\
                .limit(limit)\
                .all()

            return sessions

        except Exception as e:
            print(f"[ANALYTICS] Error getting detailed analytics: {str(e)}")
            return []

    @staticmethod
    def get_leaderboard(short_code: str, limit: int, db: Session) -> List[Dict[str, Any]]:
        """
        Get leaderboard for a short code

        Args:
            short_code: Short URL code
            limit: Number of entries to return
            db: Database session

        Returns:
            List of leaderboard entries
        """
        try:
            entries = db.query(LeaderboardEntry)\
                .filter(LeaderboardEntry.short_code == short_code)\
                .order_by(desc(LeaderboardEntry.score), LeaderboardEntry.completion_time)\
                .limit(limit)\
                .all()

            return [
                {
                    'id': entry.id,
                    'player_nickname': entry.player_nickname,
                    'player_country': entry.player_country,
                    'completion_time': entry.completion_time,
                    'hints_used': entry.hints_used,
                    'score': entry.score,
                    'difficulty': entry.difficulty,
                    'rank': entry.rank,
                    'percentile': entry.percentile,
                    'created_at': entry.created_at.isoformat() if entry.created_at else None
                }
                for entry in entries
            ]

        except Exception as e:
            print(f"[ANALYTICS] Error getting leaderboard: {str(e)}")
            return []

    @staticmethod
    def add_to_leaderboard(
        short_code: str,
        nickname: str,
        completion_time: int,
        hints_used: int,
        score: int,
        difficulty: str,
        country: Optional[str],
        db: Session
    ) -> Optional[int]:
        """
        Add entry to leaderboard

        Args:
            short_code: Short URL code
            nickname: Player nickname
            completion_time: Completion time in seconds
            hints_used: Number of hints used
            score: Final score
            difficulty: Difficulty level
            country: Player country (optional)
            db: Database session

        Returns:
            Entry ID if successful, None otherwise
        """
        try:
            entry = LeaderboardEntry(
                short_code=short_code,
                player_nickname=nickname or 'Anonymous',
                player_country=country,
                completion_time=completion_time,
                hints_used=hints_used,
                score=score,
                difficulty=difficulty
            )

            db.add(entry)
            db.commit()
            db.refresh(entry)

            # Calculate ranks
            AnalyticsService.calculate_leaderboard_ranks(short_code, db)

            print(f"[ANALYTICS] Added to leaderboard: {entry.id}")

            return entry.id

        except Exception as e:
            print(f"[ANALYTICS] Error adding to leaderboard: {str(e)}")
            db.rollback()
            return None

    @staticmethod
    def calculate_leaderboard_ranks(short_code: str, db: Session) -> None:
        """
        Calculate and update leaderboard ranks

        Args:
            short_code: Short URL code
            db: Database session
        """
        try:
            # Get all entries for this short code ordered by score
            entries = db.query(LeaderboardEntry)\
                .filter(LeaderboardEntry.short_code == short_code)\
                .order_by(desc(LeaderboardEntry.score), LeaderboardEntry.completion_time)\
                .all()

            total_count = len(entries)

            # Update rank and percentile for each entry
            for rank, entry in enumerate(entries, start=1):
                entry.rank = rank
                entry.percentile = (rank / total_count) * 100 if total_count > 0 else 0

            db.commit()

            print(f"[ANALYTICS] Leaderboard ranks updated for {short_code}")

        except Exception as e:
            print(f"[ANALYTICS] Error calculating ranks: {str(e)}")
            db.rollback()

    @staticmethod
    def get_global_analytics(db: Session) -> Dict[str, Any]:
        """
        Get global analytics (all URLs)

        Args:
            db: Database session

        Returns:
            Global statistics dictionary
        """
        try:
            # Get URL statistics
            url_stats = db.query(
                func.count(ShortURL.id).label('total_urls'),
                func.sum(ShortURL.total_views).label('total_views'),
                func.sum(ShortURL.total_completions).label('total_completions'),
                func.avg(ShortURL.avg_completion_time).label('avg_completion_time'),
                func.sum(ShortURL.total_failures).label('total_failures'),
                func.sum(ShortURL.total_timeouts).label('total_timeouts')
            ).first()

            # Get revenue statistics
            revenue = db.query(
                func.sum(URLAnalytics.estimated_revenue).label('total_revenue')
            ).first()

            total_views = url_stats.total_views or 0
            total_completions = url_stats.total_completions or 0
            completion_rate = (total_completions / total_views * 100) if total_views > 0 else 0

            return {
                'total_urls': url_stats.total_urls or 0,
                'total_views': total_views,
                'total_completions': total_completions,
                'avg_completion_time': url_stats.avg_completion_time or 0,
                'total_failures': url_stats.total_failures or 0,
                'total_timeouts': url_stats.total_timeouts or 0,
                'total_revenue': revenue.total_revenue or 0,
                'completion_rate': completion_rate
            }

        except Exception as e:
            print(f"[ANALYTICS] Error getting global analytics: {str(e)}")
            return {}

    @staticmethod
    def get_global_leaderboard(
        time_filter: str = 'all',
        limit: int = 100,
        db: Session = None
    ) -> List[Dict[str, Any]]:
        """
        Get global leaderboard across all URLs

        Args:
            time_filter: 'all', 'week', or 'today'
            limit: Number of entries to return
            db: Database session

        Returns:
            List of leaderboard entries
        """
        try:
            from datetime import datetime, timedelta

            query = db.query(LeaderboardEntry)

            # Apply time filter
            if time_filter == 'today':
                start_of_day = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
                query = query.filter(LeaderboardEntry.completed_at >= start_of_day)
            elif time_filter == 'week':
                start_of_week = datetime.utcnow() - timedelta(days=7)
                query = query.filter(LeaderboardEntry.completed_at >= start_of_week)

            # Order by score (highest first), then by completion time (fastest first)
            entries = query.order_by(
                desc(LeaderboardEntry.score),
                LeaderboardEntry.completion_time_seconds
            ).limit(limit).all()

            # Format entries with rank
            return [
                {
                    'id': entry.id,
                    'rank': idx + 1,
                    'player_nickname': entry.player_nickname,
                    'player_country': entry.player_country,
                    'completion_time': entry.completion_time_seconds,
                    'hints_used': entry.hints_used,
                    'score': entry.score,
                    'difficulty': entry.difficulty,
                    'short_code': entry.short_code,
                    'completed_at': entry.completed_at.isoformat() if entry.completed_at else None
                }
                for idx, entry in enumerate(entries)
            ]

        except Exception as e:
            print(f"[ANALYTICS] Error getting global leaderboard: {str(e)}")
            return []

    @staticmethod
    def _update_summary_stats(short_code: str, db: Session) -> None:
        """
        Update summary statistics for a URL

        Args:
            short_code: Short URL code
            db: Database session
        """
        try:
            # Get all sessions for this short code
            sessions = db.query(URLAnalytics)\
                .filter(URLAnalytics.short_code == short_code)\
                .all()

            # Calculate statistics
            total_completions = sum(1 for s in sessions if s.outcome == 'completed')
            total_failures = sum(1 for s in sessions if s.outcome == 'failed')
            total_timeouts = sum(1 for s in sessions if s.outcome == 'timeout')

            completion_times = [s.completion_time for s in sessions if s.completion_time]
            avg_completion_time = sum(completion_times) / len(completion_times) if completion_times else 0

            # Update URL record
            url = db.query(ShortURL).filter(ShortURL.short_code == short_code).first()
            if url:
                url.total_completions = total_completions
                url.total_failures = total_failures
                url.total_timeouts = total_timeouts
                url.avg_completion_time = avg_completion_time

                db.commit()

        except Exception as e:
            print(f"[ANALYTICS] Error updating summary stats: {str(e)}")
            db.rollback()
