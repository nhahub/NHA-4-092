import { api } from "./api";

export const roadmapService = {
  create({ userId, goal, category, skillLevel, weeklyHours, phaseTitles, phases, levelDescription }) {
    return api.post("/roadmap", { userId, goal, category, skillLevel, weeklyHours, phaseTitles, phases, levelDescription });
  },
    remove(roadmapId) {
        return api.delete(`/roadmap/${roadmapId}`);
    },
  checkExists(userId, { goal, category, skillLevel }) {
    const params = new URLSearchParams({ goal, category: category || "learn", skillLevel: skillLevel || "Beginner" });
    return api.get(`/roadmap/${userId}/exists?${params.toString()}`);

  },
  getForUser(userId) { return api.get(`/roadmap/${userId}`); },
  getAllForUser(userId) { return api.get(`/roadmap/${userId}/all`); },
  activate(roadmapId) { return api.patch(`/roadmap/${roadmapId}/activate`, {}); },
  updatePhase(roadmapId, phaseId, payload) { return api.patch(`/roadmap/${roadmapId}/phase/${phaseId}`, payload); },
  completeLesson(roadmapId, phaseId, lessonIndex) { return api.patch(`/roadmap/${roadmapId}/phase/${phaseId}`, { lessonIndex, lessonDone: true }); },
  saveStreak(roadmapId) { return api.patch(`/roadmap/${roadmapId}/streak`, {}); },
  readNotification(roadmapId, notificationId) { return api.patch(`/roadmap/${roadmapId}/notifications/${notificationId}`, {}); },
  readAllNotifications(roadmapId) { return api.patch(`/roadmap/${roadmapId}/notifications/read-all`, {}); },
};

export const taskService = {
  getForUser(userId) { return api.get(`/tasks/${userId}`); },
  create(payload) { return api.post("/tasks", payload); },
  update(id, payload) { return api.patch(`/tasks/${id}`, payload); },
  remove(id) { return api.delete(`/tasks/${id}`); },
  getWeeklyForUser(userId) {
        return api.get(`/tasks/${userId}/weekly`);
    },
};
