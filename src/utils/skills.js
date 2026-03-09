const VALID_SKILL_LEVELS = new Set(["beginner", "intermediate", "advanced"]);

const normalizeSkillName = (value = "") => value.toString().trim();

const normalizeSkillsInput = (skills) => {
  if (typeof skills === "string") {
    const trimmedSkills = skills.trim();

    // Accept JSON-string payloads like:
    // '[{"name":"java","level":"beginner"}]'
    if (trimmedSkills.startsWith("[") && trimmedSkills.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmedSkills);
        skills = parsed;
      } catch (err) {
        skills = trimmedSkills.split(",");
      }
    } else {
      skills = trimmedSkills.split(",");
    }
  }

  if (!Array.isArray(skills)) return [];

  return skills
    .map((skill) => {
      if (typeof skill === "string") {
        const name = normalizeSkillName(skill);
        if (!name) return null;
        return { name, level: "beginner" };
      }

      if (!skill || typeof skill !== "object") return null;

      const name = normalizeSkillName(skill.name);
      if (!name) return null;

      const level = VALID_SKILL_LEVELS.has(skill.level)
        ? skill.level
        : "beginner";

      return { name, level };
    })
    .filter(Boolean);
};

module.exports = { normalizeSkillsInput };
