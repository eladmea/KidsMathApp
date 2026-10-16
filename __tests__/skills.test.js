import { SKILLS, getSkill, skillsFor } from '../curriculum/skills';
import { GENERATORS } from '../curriculum/generators';
import { SUBJECTS } from '../curriculum/subjects';
import { AGE_BANDS, bandForAge } from '../curriculum/ageBands';

describe('skill map', () => {
  it('has unique ids', () => {
    const ids = SKILLS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only references known subjects, bands, generators and prereqs', () => {
    const subjectIds = SUBJECTS.map((s) => s.id);
    const bandIds = AGE_BANDS.map((b) => b.id);
    SKILLS.forEach((skill) => {
      expect(subjectIds).toContain(skill.subject);
      expect(bandIds).toContain(skill.band);
      if (skill.generator) expect(GENERATORS[skill.generator]).toBeDefined();
      skill.prereqs.forEach((id) => expect(getSkill(id)).toBeDefined());
    });
  });

  it('never makes a skill depend on a harder band', () => {
    const bandOrder = AGE_BANDS.map((b) => b.id);
    SKILLS.forEach((skill) => {
      skill.prereqs.forEach((id) => {
        expect(bandOrder.indexOf(getSkill(id).band)).toBeLessThanOrEqual(bandOrder.indexOf(skill.band));
      });
    });
  });

  it('has no prerequisite cycles', () => {
    const visiting = new Set();
    const done = new Set();
    const visit = (id) => {
      if (done.has(id)) return;
      if (visiting.has(id)) throw new Error(`cycle at ${id}`);
      visiting.add(id);
      getSkill(id).prereqs.forEach(visit);
      visiting.delete(id);
      done.add(id);
    };
    expect(() => SKILLS.forEach((s) => visit(s.id))).not.toThrow();
  });

  it('gives every band at least one skill a child can start immediately', () => {
    AGE_BANDS.forEach((band) => {
      const startable = skillsFor({ band: band.id, subject: 'math' }).filter(
        (s) => s.generator && s.prereqs.every((id) => getSkill(id).band !== band.id)
      );
      expect(startable.length).toBeGreaterThan(0);
    });
  });

  it('covers every playable generator', () => {
    const used = new Set(SKILLS.map((s) => s.generator).filter(Boolean));
    Object.keys(GENERATORS).forEach((id) => expect(used).toContain(id));
  });
});

describe('bandForAge', () => {
  it.each([
    [3, 'sprouts'],
    [4, 'sprouts'],
    [5, 'explorers'],
    [6, 'explorers'],
    [7, 'builders'],
    [8, 'builders'],
    [9, 'masters'],
    [10, 'masters'],
    [2, 'sprouts'],
    [12, 'masters'],
  ])('age %i -> %s', (age, bandId) => {
    expect(bandForAge(age).id).toBe(bandId);
  });
});
