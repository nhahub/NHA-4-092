import {
  faCode, faChartLine, faPalette, faBrain, faCamera, faLanguage, faPenNib, faBriefcase,
  faBullhorn, faRobot, faShieldHalved, faBookOpen, faVideo, faHome, faDumbbell, faGlobe,
  faDatabase, faMobileScreen, faGamepad, faBuilding, faComments, faStar, faFire, faBolt,
  faTrophy, faLock, faCircleCheck, faClock, faRoad, faFlag, faMedal, faUser, faGear,
  faFileLines, faChartPie, faCloud, faServer, faHandshake, faPeopleGroup, faGraduationCap,
  faHeart, faMusic, faUtensils, faPlane, faStore, faWandMagicSparkles
} from "@fortawesome/free-solid-svg-icons";

const I = [faCode, faChartLine, faPalette, faBrain, faCamera, faLanguage, faPenNib, faBriefcase, faBullhorn, faRobot, faShieldHalved, faBookOpen, faVideo, faHome, faDumbbell, faGlobe, faDatabase, faMobileScreen, faGamepad, faBuilding, faComments, faChartPie, faCloud, faServer, faHandshake, faPeopleGroup, faGraduationCap, faHeart, faMusic, faUtensils, faPlane, faStore];
const trackRows = [
  ["Web Development", "Technology"], ["Frontend Development", "Technology"], ["Backend Development", "Technology"], ["Full-Stack Development", "Technology"], ["Mobile App Development", "Technology"], ["Game Development", "Technology"],
  ["Cloud Computing", "Technology"], ["Cybersecurity", "Technology"], ["Data Analysis", "Data"], ["Data Science", "Data"], ["Machine Learning", "Data"], ["Artificial Intelligence", "Data"],
  ["Prompt Engineering", "Data"], ["Business Intelligence", "Data"], ["UI/UX Design", "Creative"], ["Graphic Design", "Creative"], ["Photography", "Creative"], ["Videography", "Creative"],
  ["Video Editing", "Creative"], ["3D Design", "Creative"], ["Interior Design", "Creative"], ["Fashion Styling", "Creative"], ["Copywriting", "Marketing"], ["Content Creation", "Marketing"],
  ["Social Media Marketing", "Marketing"], ["SEO", "Marketing"], ["Brand Strategy", "Marketing"], ["Podcast Production", "Marketing"], ["Real Estate Sales", "Business"], ["Entrepreneurship", "Business"],
  ["E-commerce", "Business"], ["Finance Basics", "Business"], ["Accounting", "Business"], ["Project Management", "Business"], ["Product Management", "Business"], ["Negotiation", "Business"],
  ["Public Speaking", "Communication"], ["English Writing", "Communication"], ["Arabic Writing", "Communication"], ["Spanish Language", "Communication"], ["Teaching Skills", "Communication"], ["Leadership", "Communication"],
  ["Fitness Coaching", "Lifestyle"], ["Nutrition", "Lifestyle"], ["Mental Models", "Lifestyle"], ["Time Management", "Lifestyle"], ["Cooking", "Lifestyle"], ["Gardening", "Lifestyle"],
  ["Medicine Prep", "Academic"], ["Chemistry", "Academic"], ["Biology", "Academic"], ["Law Basics", "Academic"], ["Political Science", "Academic"], ["Early Childhood Education", "Academic"],
  ["Event Planning", "Services"], ["Luxury Hospitality", "Services"], ["Travel Planning", "Services"], ["Supply Chain", "Services"], ["Hair Styling", "Services"], ["Music Production", "Creative"],
  ["Electronics", "Technology"], ["Career Switching", "Career"]
];
export const TRACKS = trackRows.map(([label, group], idx) => ({ label, group, icon: I[idx % I.length] }));

const A = [faStar, faFire, faBolt, faTrophy, faCircleCheck, faClock, faRoad, faFlag, faMedal, faBookOpen, faWandMagicSparkles, faLock, faUser, faGear];
const achievementRows = [
  ["First Spark", "Complete your first lesson", "Learning", "Common"], ["Phase Finisher", "Complete your first phase", "Milestone", "Common"], ["Tree Climber", "Unlock phase two", "Milestone", "Common"], ["Daily Flame", "Save your first daily streak", "Productivity", "Common"],
  ["Three-Day Streak", "Study three days in a row", "Productivity", "Rare"], ["Week Warrior", "Maintain a seven-day streak", "Productivity", "Rare"], ["Focus Rookie", "Complete one focus session", "Focus", "Common"], ["Deep Worker", "Complete five focus sessions", "Focus", "Rare"],
  ["Flow State", "Complete a 50-minute session", "Focus", "Epic"], ["Lesson Sprint", "Complete five lessons", "Learning", "Common"], ["Lesson Builder", "Complete ten lessons", "Learning", "Common"], ["Lesson Master", "Complete 25 lessons", "Learning", "Rare"],
  ["Lesson Legend", "Complete 50 lessons", "Learning", "Epic"], ["Resource Scout", "Open five resources", "Learning", "Common"], ["Practice Maker", "Finish five practice tasks", "Learning", "Rare"], ["Quiz Ready", "Review every objective in a phase", "Learning", "Rare"],
  ["XP Starter", "Earn 250 XP", "Milestone", "Common"], ["Level Two", "Reach level 2", "Milestone", "Common"], ["Level Five", "Reach level 5", "Milestone", "Rare"], ["Level Ten", "Reach level 10", "Milestone", "Epic"],
  ["Roadmap Collector", "Create two roadmaps", "Milestone", "Common"], ["Multi-Track Mind", "Create three roadmaps", "Milestone", "Rare"], ["Fresh Start", "Start a new roadmap after finishing one", "Milestone", "Epic"], ["Morning Learner", "Complete a session before noon", "Productivity", "Common"],
  ["Night Owl", "Complete a session after 8 PM", "Productivity", "Common"], ["Coffee Focus", "Start three focus sessions", "Focus", "Common"], ["Notes Keeper", "Save notes on five lessons", "Learning", "Common"], ["Objective Hunter", "Complete 20 learning objectives", "Learning", "Rare"],
  ["Unlocked Path", "Unlock three phases", "Milestone", "Rare"], ["Steady Pace", "Complete one lesson per day for a week", "Productivity", "Epic"], ["AI Builder", "Generate an AI roadmap", "Milestone", "Common"], ["Smart Planner", "Use adaptive schedule suggestions", "Productivity", "Rare"],
  ["No Zero Days", "Log progress three days in a row", "Productivity", "Epic"], ["Comeback", "Resume after missing a day", "Productivity", "Common"], ["Cold Start", "Start a hard lesson", "Mindset", "Rare"], ["Confidence Boost", "Mark a hard lesson complete", "Mindset", "Common"],
  ["Skill Collector", "Add five skills to your profile", "Profile", "Common"], ["Profile Polished", "Update your profile", "Profile", "Common"], ["Portfolio Step", "Complete a project lesson", "Learning", "Rare"], ["Capstone Ready", "Reach the final phase", "Milestone", "Epic"],
  ["Roadmap Complete", "Complete every phase", "Milestone", "Legendary"], ["Fast Learner", "Complete three lessons in one day", "Learning", "Rare"], ["Consistent Builder", "Study four weeks in a row", "Productivity", "Epic"], ["Master Planner", "Complete all tasks for a week", "Productivity", "Epic"],
  ["Curiosity Loop", "Open ten resources", "Learning", "Rare"], ["Focused Finish", "Finish a phase inside focus mode", "Focus", "Rare"], ["Elite Learner", "Earn 5000 XP", "Milestone", "Legendary"], ["Champion Mindset", "Complete 100 lessons", "Learning", "Legendary"],
  ["Dual Track Starter", "Complete 5 phases in at least 2 different tracks", "Multitasking", "Rare"], ["Triple Track Starter", "Complete 5 phases in at least 3 different tracks", "Multitasking", "Epic"],
  ["Dual Track Builder", "Complete 10 phases across 2 tracks", "Multitasking", "Rare"], ["Triple Track Builder", "Complete 10 phases across 3 tracks", "Multitasking", "Epic"],
  ["Multi-Track Momentum", "Complete 15 phases across multiple tracks", "Multitasking", "Legendary"], ["Track Sampler", "Complete at least 1 phase in 3 tracks", "Multitasking", "Common"],
  ["Track Explorer", "Complete at least 2 phases in 3 tracks", "Multitasking", "Rare"], ["Quad Track Mind", "Complete at least 3 phases in 4 tracks", "Multitasking", "Epic"],
  ["Dual Track Week", "Maintain progress in 2 tracks during the same week", "Multitasking", "Rare"], ["Triple Track Week", "Maintain progress in 3 tracks during the same week", "Multitasking", "Epic"]
];
export const ACHIEVEMENTS = achievementRows.map(([title, text, category, rarity], i) => ({ id: i + 1, title, text, category, rarity, icon: A[i % A.length] }));

export function deriveSkills(roadmap) {
  if (!roadmap?.phases) return [];
  const completedTopics = roadmap.phases.flatMap((p) => (p.lessonProgress || []).map((done, i) => done ? p.materials?.topics?.[i] : null).filter(Boolean));
  return [...new Set(completedTopics)].slice(0, 24);
}
