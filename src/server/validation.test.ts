import { test } from "node:test";
import { strictEqual, ok } from "node:assert";
import { widgetConfigSchema } from "@/server/validation";

// Helper to test just the staffResumeHours field
const testStaffResumeHours = (value: string) => {
  const result = widgetConfigSchema.safeParse({
    mode: "BUBBLE",
    position: "BOTTOM_RIGHT",
    botName: "Test Bot",
    primaryColor: "#4F46E5",
    logoUrl: "",
    welcomeMessage: "Hello",
    inputPlaceholder: "Type here",
    leadFormEnabled: false,
    leadFormTitle: "Title",
    leadFormDescription: "Desc",
    leadFormSubmitLabel: "Submit",
    leadFormNameLabel: "Name",
    leadFormPhoneLabel: "Phone",
    leadFormFields: "[]",
    staffResumeHours: value,
  });
  return result;
};

test("widgetConfigSchema - staffResumeHours regex: valid hours 1", () => {
  const result = testStaffResumeHours("1");
  ok(result.success, "should accept 1");
  if (result.success) strictEqual(result.data.staffResumeHours, 1);
});

test("widgetConfigSchema - staffResumeHours regex: valid hours 9", () => {
  const result = testStaffResumeHours("9");
  ok(result.success, "should accept 9");
  if (result.success) strictEqual(result.data.staffResumeHours, 9);
});

test("widgetConfigSchema - staffResumeHours regex: valid hours 10", () => {
  const result = testStaffResumeHours("10");
  ok(result.success, "should accept 10");
  if (result.success) strictEqual(result.data.staffResumeHours, 10);
});

test("widgetConfigSchema - staffResumeHours regex: valid hours 24", () => {
  const result = testStaffResumeHours("24");
  ok(result.success, "should accept 24");
  if (result.success) strictEqual(result.data.staffResumeHours, 24);
});

test("widgetConfigSchema - staffResumeHours regex: valid hours 99", () => {
  const result = testStaffResumeHours("99");
  ok(result.success, "should accept 99");
  if (result.success) strictEqual(result.data.staffResumeHours, 99);
});

test("widgetConfigSchema - staffResumeHours regex: valid hours 100", () => {
  const result = testStaffResumeHours("100");
  ok(result.success, "should accept 100");
  if (result.success) strictEqual(result.data.staffResumeHours, 100);
});

test("widgetConfigSchema - staffResumeHours regex: valid hours 599", () => {
  const result = testStaffResumeHours("599");
  ok(result.success, "should accept 599");
  if (result.success) strictEqual(result.data.staffResumeHours, 599);
});

test("widgetConfigSchema - staffResumeHours regex: valid hours 699", () => {
  const result = testStaffResumeHours("699");
  ok(result.success, "should accept 699");
  if (result.success) strictEqual(result.data.staffResumeHours, 699);
});

test("widgetConfigSchema - staffResumeHours regex: valid hours 700", () => {
  const result = testStaffResumeHours("700");
  ok(result.success, "should accept 700");
  if (result.success) strictEqual(result.data.staffResumeHours, 700);
});

test("widgetConfigSchema - staffResumeHours regex: valid hours 719", () => {
  const result = testStaffResumeHours("719");
  ok(result.success, "should accept 719");
  if (result.success) strictEqual(result.data.staffResumeHours, 719);
});

test("widgetConfigSchema - staffResumeHours regex: valid hours 720", () => {
  const result = testStaffResumeHours("720");
  ok(result.success, "should accept 720");
  if (result.success) strictEqual(result.data.staffResumeHours, 720);
});

// Invalid cases - should fail
test("widgetConfigSchema - staffResumeHours regex: reject 0", () => {
  const result = testStaffResumeHours("0");
  strictEqual(result.success, false, "should reject 0");
});

test("widgetConfigSchema - staffResumeHours regex: reject 721", () => {
  const result = testStaffResumeHours("721");
  strictEqual(result.success, false, "should reject 721 (exceeds max)");
});

test("widgetConfigSchema - staffResumeHours regex: reject 800", () => {
  const result = testStaffResumeHours("800");
  strictEqual(result.success, false, "should reject 800 (exceeds max)");
});

test("widgetConfigSchema - staffResumeHours regex: reject 999", () => {
  const result = testStaffResumeHours("999");
  strictEqual(result.success, false, "should reject 999 (exceeds max)");
});

test("widgetConfigSchema - staffResumeHours regex: reject leading zero 099", () => {
  const result = testStaffResumeHours("099");
  strictEqual(result.success, false, "should reject leading zero 099");
});

test("widgetConfigSchema - staffResumeHours regex: reject leading zero 01", () => {
  const result = testStaffResumeHours("01");
  strictEqual(result.success, false, "should reject leading zero 01");
});

test("widgetConfigSchema - staffResumeHours regex: reject non-numeric abc", () => {
  const result = testStaffResumeHours("abc");
  strictEqual(result.success, false, "should reject non-numeric abc");
});

test("widgetConfigSchema - staffResumeHours regex: reject empty string", () => {
  const result = testStaffResumeHours("");
  strictEqual(result.success, false, "should reject empty string");
});

test("widgetConfigSchema - staffResumeHours regex: transforms string to number", () => {
  const result = testStaffResumeHours("24");
  ok(result.success, "should accept 24");
  if (result.success) {
    strictEqual(result.data.staffResumeHours, 24);
    strictEqual(typeof result.data.staffResumeHours, "number");
  }
});
