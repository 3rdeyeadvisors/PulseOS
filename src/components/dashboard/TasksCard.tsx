import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, Circle, Plus, Trash2, ListTodo, Users } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TaskInviteModal } from './TaskInviteModal';

interface Participant {
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  isOwner: boolean;
  participants: Participant[];
}

export function TasksCard() {
  const { user, session } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState('');
  const [adding, setAdding] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [taskToInvite, setTaskToInvite] = useState<Task | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch user's own tasks
      const { data: ownTasks, error: ownError } = await supabase
        .from('tasks')
        .select('id, title, completed')
        .eq('user_id', user.id)
        .order('completed', { ascending: true })
        .order('created_at', { ascending: false });

      if (ownError) throw ownError;

      // Fetch tasks where user has accepted an invite
      const { data: acceptedInvites, error: inviteError } = await supabase
        .from('task_invites')
        .select('task_id')
        .eq('receiver_id', user.id)
        .eq('status', 'accepted');

      if (inviteError) throw inviteError;

      // Get the shared tasks
      const sharedTaskIds = acceptedInvites?.map(i => i.task_id) || [];
      let sharedTasks: { id: string; title: string; completed: boolean }[] = [];
      
      if (sharedTaskIds.length > 0) {
        const { data: shared, error: sharedError } = await supabase
          .from('tasks')
          .select('id, title, completed')
          .in('id', sharedTaskIds);
        
        if (!sharedError && shared) {
          sharedTasks = shared;
        }
      }

      // Combine all task IDs to fetch participants
      const allTaskIds = [
        ...(ownTasks?.map(t => t.id) || []),
        ...sharedTaskIds
      ];

      // Fetch all accepted invites for these tasks to get participants
      const participantsMap: Record<string, Participant[]> = {};
      
      if (allTaskIds.length > 0) {
        const { data: allInvites } = await supabase
          .from('task_invites')
          .select('task_id, sender_id, receiver_id, status')
          .in('task_id', allTaskIds)
          .eq('status', 'accepted');

        if (allInvites && allInvites.length > 0) {
          // Get unique user IDs
          const userIds = new Set<string>();
          allInvites.forEach(inv => {
            userIds.add(inv.sender_id);
            userIds.add(inv.receiver_id);
          });

          // Fetch profiles
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, username, full_name, avatar_url')
            .in('user_id', Array.from(userIds));

          const profilesMap = new Map(profiles?.map(p => [p.user_id, p]));

          // Build participants map per task
          allInvites.forEach(inv => {
            if (!participantsMap[inv.task_id]) {
              participantsMap[inv.task_id] = [];
            }
            
            const receiver = profilesMap.get(inv.receiver_id);
            if (receiver && !participantsMap[inv.task_id].some(p => p.user_id === inv.receiver_id)) {
              participantsMap[inv.task_id].push(receiver as Participant);
            }
          });
        }
      }

      // Combine and deduplicate tasks
      const ownTasksWithMeta = (ownTasks || []).map(t => ({
        ...t,
        isOwner: true,
        participants: participantsMap[t.id] || []
      }));

      const sharedTasksWithMeta = sharedTasks
        .filter(t => !ownTasks?.some(own => own.id === t.id))
        .map(t => ({
          ...t,
          isOwner: false,
          participants: participantsMap[t.id] || []
        }));

      setTasks([...ownTasksWithMeta, ...sharedTasksWithMeta]);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && session) fetchTasks();
  }, [user, session, fetchTasks]);

  // Listen for task invite updates
  useEffect(() => {
    const handleInviteUpdate = () => {
      fetchTasks();
    };
    
    window.addEventListener('task-invite-updated', handleInviteUpdate);
    return () => window.removeEventListener('task-invite-updated', handleInviteUpdate);
  }, [fetchTasks]);

  const addTask = async () => {
    if (!newTask.trim() || !user || adding) return;

    setAdding(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({ user_id: user.id, title: newTask.trim() })
        .select('id, title, completed')
        .single();

      if (error) throw error;
      setTasks((prev) => [{ ...data, isOwner: true, participants: [] }, ...prev]);
      setNewTask('');
      
      // Dispatch custom event to notify score card
      window.dispatchEvent(new CustomEvent('task-updated'));
    } catch (err) {
      toast.error('Failed to add task');
    } finally {
      setAdding(false);
    }
  };

  const toggleTask = async (id: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !completed })
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !completed } : t))
      );
      
      // Dispatch custom event to notify score card
      window.dispatchEvent(new CustomEvent('task-updated'));
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  const handleDeleteClick = (task: Task) => {
    if (task.completed) {
      // Show warning for completed tasks
      setTaskToDelete(task);
      setShowDeleteWarning(true);
    } else {
      // Delete directly for incomplete tasks
      deleteTask(task.id, false);
    }
  };

  const deleteTask = async (id: string, wasCompleted: boolean) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);

      if (error) throw error;
      setTasks((prev) => prev.filter((t) => t.id !== id));

      // If the task was completed, we need to deduct points
      if (wasCompleted) {
        await deductPointsForDeletedTask();
        toast.info('Task deleted and points deducted');
      }
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const deductPointsForDeletedTask = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];

    try {
      // Get current daily score
      const { data: currentScore } = await supabase
        .from('daily_action_scores')
        .select('*')
        .eq('user_id', user.id)
        .eq('score_date', today)
        .maybeSingle();

      if (currentScore) {
        const newTasksCompleted = Math.max(0, currentScore.tasks_completed - 1);
        const pointsDeducted = 10; // 10 points per task
        const newDailyScore = Math.max(0, currentScore.daily_score - pointsDeducted);

        await supabase
          .from('daily_action_scores')
          .update({
            tasks_completed: newTasksCompleted,
            daily_score: newDailyScore,
          })
          .eq('user_id', user.id)
          .eq('score_date', today);

        // Dispatch event to update UI and leaderboard
        window.dispatchEvent(new CustomEvent('task-updated'));
        window.dispatchEvent(new CustomEvent('daily-score-updated'));
      }
    } catch (err) {
      console.error('Failed to deduct points:', err);
    }
  };

  const confirmDeleteCompletedTask = () => {
    if (taskToDelete) {
      deleteTask(taskToDelete.id, true);
      setTaskToDelete(null);
      setShowDeleteWarning(false);
    }
  };

  if (loading) {
    return (
      <div className="p-5 rounded-xl bg-card border border-border/50 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-xl bg-card border border-border/50 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <ListTodo className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">Tasks</h3>
      </div>

      {/* Add task input */}
      <div className="flex gap-2 mb-3">
        <Input
          placeholder="Add a task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
          className="h-10 sm:h-9 text-sm"
        />
        <Button
          size="icon"
          className="h-10 w-10 sm:h-9 sm:w-9 shrink-0"
          onClick={addTask}
          disabled={adding || !newTask.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Task list */}
      <div 
        className="max-h-48 overflow-y-scroll"
        style={{ overscrollBehavior: 'contain' }}
      >
        <div className="space-y-1">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">No tasks yet</p>
          ) : (
            tasks.map((task) => {
              const getInitials = (name: string | null | undefined) => {
                if (!name) return '?';
                return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
              };

              return (
                <div
                  key={task.id}
                  className="group flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/30 transition-colors"
                >
                  <button
                    onClick={() => toggleTask(task.id, task.completed)}
                    className="shrink-0 h-10 w-10 sm:h-8 sm:w-8 flex items-center justify-center -ml-2"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="h-5 w-5 sm:h-4 sm:w-4 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 sm:h-4 sm:w-4 text-muted-foreground" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-sm truncate block ${
                        task.completed ? 'line-through text-muted-foreground' : ''
                      }`}
                    >
                      {task.title}
                    </span>
                    {/* Show participants */}
                    {task.participants.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <TooltipProvider>
                          <div className="flex -space-x-1.5">
                            {task.participants.slice(0, 3).map((p) => (
                              <Tooltip key={p.user_id}>
                                <TooltipTrigger asChild>
                                  <Avatar className="h-4 w-4 border border-background">
                                    <AvatarImage src={p.avatar_url || undefined} />
                                    <AvatarFallback className="text-[8px]">
                                      {getInitials(p.full_name || p.username)}
                                    </AvatarFallback>
                                  </Avatar>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs">
                                  {p.full_name || p.username || 'Friend'}
                                </TooltipContent>
                              </Tooltip>
                            ))}
                            {task.participants.length > 3 && (
                              <span className="text-[10px] text-muted-foreground ml-1.5">
                                +{task.participants.length - 3}
                              </span>
                            )}
                          </div>
                        </TooltipProvider>
                        <span className="text-[10px] text-muted-foreground">
                          {task.isOwner ? 'challenged' : 'with you'}
                        </span>
                      </div>
                    )}
                    {/* Show "shared" indicator for tasks user accepted */}
                    {!task.isOwner && task.participants.length === 0 && (
                      <span className="text-[10px] text-primary">Shared task</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {task.isOwner && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 sm:h-7 sm:w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTaskToInvite(task);
                          setInviteModalOpen(true);
                        }}
                        title="Invite friends"
                      >
                        <Users className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-primary" />
                      </Button>
                    )}
                    {task.isOwner && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 sm:h-7 sm:w-7"
                        onClick={() => handleDeleteClick(task)}
                      >
                        <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Warning dialog for deleting completed tasks */}
      <AlertDialog open={showDeleteWarning} onOpenChange={setShowDeleteWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete completed task?</AlertDialogTitle>
            <AlertDialogDescription>
              This task has already been completed and you received points for it. 
              If you delete it, <strong>10 points will be deducted</strong> from your daily score 
              and the leaderboard will be updated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTaskToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteCompletedTask}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Task Invite Modal */}
      {taskToInvite && (
        <TaskInviteModal
          open={inviteModalOpen}
          onOpenChange={(open) => {
            setInviteModalOpen(open);
            if (!open) setTaskToInvite(null);
          }}
          taskId={taskToInvite.id}
          taskTitle={taskToInvite.title}
        />
      )}
    </div>
  );
}
