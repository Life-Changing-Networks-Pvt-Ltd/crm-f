// @ts-nocheck
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2, Copy, ExternalLink, FileJson, ImagePlus, Loader2,
  MessageSquare, Plus, RefreshCw, Rocket, Search, Send, Trash2, WandSparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@whatsapp/components/ui/badge";
import { Button } from "@whatsapp/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@whatsapp/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@whatsapp/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@whatsapp/components/ui/dropdown-menu";
import { Input } from "@whatsapp/components/ui/input";
import { Label } from "@whatsapp/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@whatsapp/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@whatsapp/components/ui/tabs";
import { Textarea } from "@whatsapp/components/ui/textarea";
import { getAuthHeaders } from "@whatsapp/contexts/AuthContext";

const API = "/api/webhook/whatsapp/flows";
const categories = [
  "SIGN_UP", "SIGN_IN", "APPOINTMENT_BOOKING", "LEAD_GENERATION",
  "CONTACT_US", "CUSTOMER_SUPPORT", "SURVEY", "OTHER",
];

type BuilderOption = {
  id: string;
  title: string;
  response: string;
  image?: string;
  nextType?: "response" | "options";
  nextQuestion?: string;
  options?: BuilderOption[];
};
const defaultOptions: BuilderOption[] = [
  { id: "products", title: "View products", response: "Our product team will contact you shortly.", nextType: "response" },
  { id: "support", title: "Get support", response: "Please share your issue with our support agent in chat.", nextType: "response" },
];

function newBuilderOption(index: number): BuilderOption {
  return {
    id: `option_${index}`,
    title: "",
    response: "",
    nextType: "response",
    nextQuestion: "What would you like to choose?",
    options: [],
  };
}

function normalizeOptions(options: BuilderOption[] = []): BuilderOption[] {
  return options.map((option) => ({
    ...option,
    nextType: option.nextType || "response",
    nextQuestion: option.nextQuestion || "What would you like to choose?",
    options: normalizeOptions(option.options || []),
  }));
}

function updateOptionTree(
  options: BuilderOption[],
  path: number[],
  updater: (option: BuilderOption) => BuilderOption
): BuilderOption[] {
  const [index, ...rest] = path;
  return options.map((option, optionIndex) => {
    if (optionIndex !== index) return option;
    if (!rest.length) return updater(option);
    return {
      ...option,
      options: updateOptionTree(option.options || [], rest, updater),
    };
  });
}

function removeOptionFromTree(options: BuilderOption[], path: number[]): BuilderOption[] {
  const [index, ...rest] = path;
  if (!rest.length) return options.filter((_, optionIndex) => optionIndex !== index);
  return options.map((option, optionIndex) =>
    optionIndex === index
      ? { ...option, options: removeOptionFromTree(option.options || [], rest) }
      : option
  );
}

function previewImageSource(value?: string) {
  if (!value) return "";
  if (value.startsWith("data:") || value.startsWith("http") || value.startsWith("blob:")) return value;
  const mimeType = value.startsWith("iVBOR")
    ? "image/png"
    : value.startsWith("UklGR")
      ? "image/webp"
      : value.startsWith("R0lGOD")
        ? "image/gif"
        : "image/jpeg";
  return `data:${mimeType};base64,${value}`;
}

function flowImageSource(value?: string) {
  if (!value) return "";
  const dataUrlMatch = value.match(/^data:image\/(?:png|jpeg);base64,(.+)$/);
  return dataUrlMatch ? dataUrlMatch[1] : value;
}

function PhoneFlowPreview({
  builder,
  selectedPath,
  pendingIndex,
  onSelect,
  onContinue,
  onBack,
}: {
  builder: any;
  selectedPath: number[];
  pendingIndex: number | null;
  onSelect: (index: number) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  let currentOptions = builder.options || [];
  let currentQuestion = builder.question || "What would you like to do?";
  let currentStepOption: BuilderOption | null = null;
  selectedPath.forEach((index) => {
    const option = currentOptions[index];
    if (!option) return;
    currentStepOption = option;
    if (option.nextType === "options") {
      currentOptions = option.options || [];
      currentQuestion = option.nextQuestion || "What would you like to choose?";
    }
  });
  const isResponseScreen = Boolean(
    currentStepOption && currentStepOption.nextType !== "options"
  );
  const visibleOptions = isResponseScreen ? [] : currentOptions;
  const visibleQuestion = currentQuestion;

  return (
    <div className="mx-auto w-full max-w-[340px]">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Live phone preview</div>
          <div className="text-xs text-muted-foreground">Updates as you edit the flow</div>
        </div>
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700">Live</Badge>
      </div>
      <div className="rounded-[2.6rem] border-[7px] border-slate-900 bg-slate-900 p-1 shadow-2xl">
        <div className="relative h-[650px] overflow-hidden rounded-[2rem] bg-[#efeae2]">
          <div className="absolute left-1/2 top-2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-slate-900" />
          <div className="flex h-16 items-end gap-3 bg-[#075e54] px-4 pb-3 text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-sm font-semibold">W</div>
            <div>
              <div className="text-sm font-semibold">Your Business</div>
              <div className="text-[10px] text-white/75">Business account · online</div>
            </div>
          </div>
          <div className="h-[calc(100%-4rem)] overflow-y-auto p-3">
            <div className="max-w-[92%] overflow-hidden rounded-xl rounded-tl-none bg-white shadow-sm">
              {selectedPath.length === 0 && builder.bannerImage && (
                <img
                  src={previewImageSource(builder.bannerImage)}
                  alt=""
                  className="h-36 w-full bg-slate-100 object-cover"
                />
              )}
              <div className="space-y-3 p-4">
                {selectedPath.length === 0 && (
                  <p className="whitespace-pre-line text-sm leading-relaxed text-slate-800">
                    {builder.message || "How can we help you?"}
                  </p>
                )}
                {selectedPath.length > 0 && (
                  <button type="button" onClick={onBack} className="text-left text-xs font-medium text-[#008069]">
                    ← Back
                  </button>
                )}
                {isResponseScreen ? (
                  <div className="space-y-3">
                    {currentStepOption?.image && (
                      <img
                        src={previewImageSource(currentStepOption.image)}
                        alt=""
                        className="max-h-48 w-full rounded-lg object-cover"
                      />
                    )}
                    <div className="text-lg font-semibold text-slate-900">
                      {currentStepOption?.title || "Done"}
                    </div>
                    <p className="text-sm leading-relaxed text-slate-700">
                      {currentStepOption?.response || "Your selection has been received."}
                    </p>
                  </div>
                ) : (
                  <>
                    {selectedPath.length > 0 && (
                      <div className="pt-1 text-sm font-medium text-slate-800">{visibleQuestion}</div>
                    )}
                    <div className="space-y-2">
                      {visibleOptions.slice(0, 3).map((option: BuilderOption, index: number) => {
                    const isSelected = pendingIndex === index;
                    return (
                      <button
                        type="button"
                        key={`${option.id}-${index}`}
                        onClick={() => onSelect(index)}
                        className={`flex w-full items-center justify-center rounded-lg border-0 border-t p-3 text-center font-medium text-[#008069] transition ${
                          isSelected ? "bg-emerald-50 ring-2 ring-[#00a884]" : "bg-white"
                        }`}
                      >
                        {option.image && (
                          <img
                            src={previewImageSource(option.image)}
                            alt=""
                            className="h-10 w-10 rounded-md bg-slate-100 object-cover"
                          />
                        )}
                        <span className="min-w-0 text-sm text-slate-800">
                          {option.title || `Option ${index + 1}`}
                        </span>
                      </button>
                    );
                  })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        Reply buttons appear inside the WhatsApp chat, like the Lenskart flow.
      </p>
    </div>
  );
}

function OptionEditor({
  option,
  index,
  path,
  depth,
  canDelete,
  updateAtPath,
  removeAtPath,
  addChildAtPath,
}: {
  option: BuilderOption;
  index: number;
  path: number[];
  depth: number;
  canDelete: boolean;
  updateAtPath: (path: number[], patch: Partial<BuilderOption>) => void;
  removeAtPath: (path: number[]) => void;
  addChildAtPath: (path: number[]) => void;
}) {
  const nestedOptions = option.options || [];
  return (
    <Card className={depth > 0 ? "border-l-4 border-l-emerald-300 bg-emerald-50/20" : ""}>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div className="font-medium">{depth > 0 ? `Nested option ${index + 1}` : `Option ${index + 1}`}</div>
          {canDelete && (
            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => removeAtPath(path)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="space-y-2">
            <Label>Option text</Label>
            <Input
              value={option.title}
              maxLength={20}
              onChange={(e) => updateAtPath(path, { title: e.target.value })}
              placeholder="Get Invoice"
            />
        </div>
        <div className="space-y-2">
          <Label>When user selects this option</Label>
          <Select
            value={option.nextType || "response"}
            onValueChange={(value) =>
              updateAtPath(path, {
                nextType: value,
                ...(value === "options" && !nestedOptions.length
                  ? { options: [newBuilderOption(1), newBuilderOption(2)] }
                  : {}),
              })
            }
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="response">Send a response</SelectItem>
              <SelectItem value="options">Show another set of options</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(option.nextType || "response") === "response" ? (
          <>
            <div className="space-y-2">
              <Label>Response message</Label>
              <Textarea
                value={option.response}
                onChange={(e) => updateAtPath(path, { response: e.target.value })}
                placeholder="Your invoice is ready. Please use the link below..."
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer">
                <Input
                  type="file"
                  accept="image/*,.png,.jpg,.jpeg,.jfif,.webp,.bmp,.gif"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      updateAtPath(path, { image: await fileToBase64(file) });
                    } catch (error) {
                      toast.error((error as Error).message);
                    }
                  }}
                />
                <Button type="button" size="sm" variant="outline" asChild>
                  <span><ImagePlus className="mr-2 h-4 w-4" />{option.image ? "Change image" : "Add image"}</span>
                </Button>
              </label>
              {option.image && (
                <Button size="sm" variant="ghost" onClick={() => updateAtPath(path, { image: undefined })}>
                  Remove
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-3 rounded-lg border border-emerald-200 bg-white p-3">
            <div className="space-y-2">
              <Label>Next question</Label>
              <Input
                value={option.nextQuestion || ""}
                onChange={(e) => updateAtPath(path, { nextQuestion: e.target.value })}
                placeholder="Which product are you interested in?"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium">Next options</div>
              {depth < 3 && (
                <Button type="button" size="sm" variant="outline" disabled={nestedOptions.length >= 3} onClick={() => addChildAtPath(path)}>
                  <Plus className="mr-2 h-4 w-4" />Add nested button
                </Button>
              )}
            </div>
            {depth >= 3 && (
              <p className="text-xs text-amber-700">Maximum 4 option levels are supported in the visual builder.</p>
            )}
            <div className="space-y-3">
              {nestedOptions.map((nestedOption, nestedIndex) => (
                <OptionEditor
                  key={`${nestedOption.id}-${nestedIndex}`}
                  option={nestedOption}
                  index={nestedIndex}
                  path={[...path, nestedIndex]}
                  depth={depth + 1}
                  canDelete
                  updateAtPath={updateAtPath}
                  removeAtPath={removeAtPath}
                  addChildAtPath={addChildAtPath}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function validOptions(options: BuilderOption[] = []) {
  return options.filter((option) => option.id.trim() && option.title.trim());
}

function alphabeticIndex(index: number) {
  let value = index + 1;
  let result = "";
  while (value > 0) {
    value -= 1;
    result = String.fromCharCode(65 + (value % 26)) + result;
    value = Math.floor(value / 26);
  }
  return result;
}

function optionMetaId(path: number[]) {
  return `OPTION_${path.map(alphabeticIndex).join("_")}`;
}

function validateBuilder(config: any) {
  const errors: string[] = [];
  if (!String(config.message || "").trim()) errors.push("Message is required");

  const visit = (options: BuilderOption[] = [], label = "Options") => {
    const available = options.filter((option) => option.id.trim() || option.title.trim());
    if (!available.length) {
      errors.push(`${label}: add at least one option`);
      return;
    }
    if (available.length > 3) {
      errors.push(`${label}: WhatsApp allows a maximum of 3 reply buttons per message`);
    }
    available.forEach((option, index) => {
      const optionLabel = `${label} → Option ${index + 1}`;
      if (!option.id.trim()) errors.push(`${optionLabel}: Option ID is required`);
      if (!option.title.trim()) errors.push(`${optionLabel}: Customer-facing text is required`);
      if (option.title.trim().length > 20) errors.push(`${optionLabel}: Button text must be 20 characters or fewer`);
      const nested = option.options || [];
      if (option.nextType === "options") {
        if (!String(option.nextQuestion || "").trim()) {
          errors.push(`${optionLabel}: Next question is required`);
        }
        visit(nested, `${optionLabel} nested options`);
      } else if (!option.response.trim() && !option.image) {
        errors.push(`${optionLabel}: add response text or an image`);
      }
    });
  };

  visit(config.options || []);
  return errors;
}

function flowIssueHelp(issue: string) {
  const normalized = issue.toLowerCase();
  if (normalized.includes("maximum number of footer")) {
    return "Only one Footer is allowed on a screen. Use a Navigation List for branching options.";
  }
  if (normalized.includes("endpoint_uri") || normalized.includes("endpoint url")) {
    return "Click Fix errors automatically. The dashboard will create a secure HTTPS endpoint, register its encryption key with Meta, and attach it to this Flow.";
  }
  if (normalized.includes("flow_json asset name") || normalized.includes("flow.json")) {
    return "The uploaded Meta asset must be named exactly flow.json. Click Fix errors automatically to upload it again with the correct filename.";
  }
  if (normalized.includes("missing in the next screen") || normalized.includes("data model")) {
    return "Remove the unused navigation payload or declare every payload field in the destination screen data.";
  }
  if (normalized.includes("only consist of alphabets and underscores") || normalized.includes("identifier")) {
    return "Rename screen, component and option IDs so they contain only letters and underscores.";
  }
  if (normalized.includes("image")) {
    return "Use a PNG/JPG image under 300 KB and upload it again.";
  }
  if (normalized.includes("required")) {
    return "Fill the required field shown in the error before saving.";
  }
  return "Regenerate the Flow JSON from the Visual Builder, then validate and save the draft again.";
}

function parseFlowIssues(message: string) {
  return message
    .replace(/^Flow JSON upload has validation errors:\s*/i, "")
    .replace(/^Flow form has validation errors:\s*/i, "")
    .replace(/^Draft JSON validation failed:\s*/i, "")
    .split(/;\s*|\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildOptionFlow(config: any) {
  const rootOptions = validOptions(normalizeOptions(config.options || []));
  const screens: any[] = [];
  const routingModel: Record<string, string[]> = {};
  const getScreenId = (path: number[]) =>
    path.length
      ? `STEP_${path.map(alphabeticIndex).join("_")}`
      : config.bannerImage
        ? "MENU"
        : "START";

  const addScreen = (options: BuilderOption[], path: number[], parentOption?: BuilderOption) => {
    const id = getScreenId(path);
    const valid = validOptions(options);
    const isRoot = path.length === 0;
    const question = isRoot
      ? config.question || "What would you like to do?"
      : parentOption?.nextQuestion || "What would you like to choose?";

    routingModel[id] = valid.map((_, index) => getScreenId([...path, index]));
    const listItems = valid.map((option, index) => {
      const childPath = [...path, index];
      return {
        id: optionMetaId(childPath),
        "main-content": {
          title: String(option.title).slice(0, 30),
          ...(option.response?.trim()
            ? { description: String(option.response).slice(0, 20) }
            : {}),
        },
        "on-click-action": {
          name: "navigate",
          next: { type: "screen", name: getScreenId(childPath) },
        },
      };
    });

    valid.forEach((option, index) => {
      const childPath = [...path, index];
      const childId = getScreenId(childPath);
      const nested = validOptions(option.options || []);
      if (option.nextType === "options" && nested.length) {
        addScreen(nested, childPath, option);
        return;
      }

      const responseChildren: any[] = [];
      if (option.image) {
        responseChildren.push({
          type: "Image",
          src: flowImageSource(option.image),
          "scale-type": "contain",
          "aspect-ratio": 1.5,
          "alt-text": option.title,
        });
      }
      responseChildren.push(
        { type: "TextHeading", text: option.title },
        { type: "TextBody", text: option.response || `You selected ${option.title}` },
        {
          type: "Footer",
          label: "Done",
          "on-click-action": {
            name: "complete",
            payload: { selected_option: option.id },
          },
        }
      );
      routingModel[childId] = [];
      screens.push({
        id: childId,
        title: String(option.title || "Response").slice(0, 30),
        terminal: true,
        success: true,
        data: {},
        layout: {
          type: "SingleColumnLayout",
          children: [{ type: "Form", name: "form", children: responseChildren }],
        },
      });
    });

    screens.push({
      id,
      title: String(
        isRoot ? config.screenTitle || "Select an option" : parentOption?.title || "Select an option"
      ).slice(0, 30),
      terminal: false,
      data: {},
      layout: {
        type: "SingleColumnLayout",
        children: [{
          type: "NavigationList",
          name: path.length
            ? `navigation_${path.map((index) => alphabeticIndex(index).toLowerCase()).join("_")}`
            : "navigation_start",
          label: String(
            isRoot ? config.heading || question : parentOption?.title || question
          ).slice(0, 80),
          description: String(
            isRoot ? config.description || question : question
          ).slice(0, 300),
          "list-items": listItems,
        }],
      },
    });
  };

  addScreen(rootOptions, []);
  if (config.bannerImage) {
    routingModel.START = ["MENU"];
    screens.push({
      id: "START",
      title: String(config.screenTitle || "Welcome").slice(0, 30),
      terminal: false,
      data: {},
      layout: {
        type: "SingleColumnLayout",
        children: [{
          type: "Form",
          name: "intro_form",
          children: [
            {
              type: "Image",
              src: flowImageSource(config.bannerImage),
              "scale-type": "contain",
              "aspect-ratio": 1.91,
              "alt-text": config.heading || "Flow image",
            },
            { type: "TextHeading", text: config.heading || "Welcome" },
            ...(config.description?.trim()
              ? [{ type: "TextBody", text: config.description.trim() }]
              : []),
            {
              type: "Footer",
              label: String(config.submitLabel || "Continue").slice(0, 35),
              "on-click-action": {
                name: "navigate",
                next: { type: "screen", name: "MENU" },
              },
            },
          ],
        }],
      },
    });
  }
  return {
    version: "7.3",
    data_api_version: "3.0",
    routing_model: routingModel,
    screens: screens.reverse(),
  };
}

const defaultBuilder = {
  screenTitle: "Select an option",
  heading: "Choose an option",
  description: "",
  question: "Choose an option",
  submitLabel: "Continue",
  message: "How can we help you?",
  bannerImage: "",
  options: defaultOptions,
};
const starterFlow = buildOptionFlow(defaultBuilder);

async function fileToBase64(file: File) {
  if (file.size > 300 * 1024) throw new Error("Image must be 300 KB or smaller");
  if (!["image/png", "image/jpeg"].includes(file.type)) {
    throw new Error("Only PNG or JPG/JPEG images are supported by WhatsApp Flows");
  }
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read image"));
    reader.readAsDataURL(file);
  });
}

async function apiFetch(path = "", init: RequestInit = {}) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      ...getAuthHeaders(),
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const metaError = data.meta?.error || {};
    const userTitle = data.userTitle || metaError.error_user_title;
    const userMessage = data.userMessage || metaError.error_user_msg;
    const actualMessage = [userTitle, userMessage]
      .filter(Boolean)
      .filter((value, index, values) => values.indexOf(value) === index)
      .join(": ");
    throw new Error(
      [actualMessage || data.error || data.message, actualMessage ? "" : data.details, data.hint, data.code ? `Meta code ${data.code}` : ""]
        .filter(Boolean).join(" — ") || "Request failed"
    );
  }
  return data;
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    PUBLISHED: "bg-emerald-100 text-emerald-700", DRAFT: "bg-amber-100 text-amber-700",
    DEPRECATED: "bg-slate-100 text-slate-700", BLOCKED: "bg-red-100 text-red-700",
    THROTTLED: "bg-orange-100 text-orange-700",
  };
  return <Badge className={styles[status] || ""}>{status}</Badge>;
}

function prettyAnswers(value: unknown) {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value as Record<string, unknown>).filter(
    ([key]) => !["flow_token", "flow_id", "flow_name"].includes(key)
  );
}

function digitsOnly(value = "") {
  return String(value || "").replace(/\D+/g, "");
}

function normalizeSendPhone(countryCode = "91", phone = "") {
  const code = digitsOnly(countryCode) || "91";
  const digits = digitsOnly(phone);
  if (!digits) return "";
  if (digits.startsWith(code) && digits.length > code.length + 6) return digits;
  return `${code}${digits}`;
}

function contactPhone(contact: any) {
  return String(contact?.phone || contact?.mobile || contact?.number || contact?.whatsapp || "").trim();
}

function contactName(contact: any) {
  return String(contact?.name || contact?.fullName || contact?.customerName || "Unnamed contact").trim();
}

function contactKey(contact: any, source = "contact") {
  return `${source}:${contact?.id || contact?._id || contactPhone(contact)}`;
}

function metaSendResponseText(result: any) {
  const response = result?.response || {};
  const error = response.error || response.metaError || response.meta?.error || response.data?.error;
  const lines = [
    result?.ok ? "Flow sent successfully." : "Flow send failed.",
    result?.phone ? `Phone: ${result.phone}` : "",
    result?.status ? `HTTP status: ${result.status}` : "",
    response.message ? `Message: ${response.message}` : "",
    response.messageId ? `Meta message ID: ${response.messageId}` : "",
    response.flow ? `Flow: ${response.flow}` : "",
    response.id ? `Response ID: ${response.id}` : "",
    response.code ? `Code: ${response.code}` : "",
    response.details ? `Details: ${response.details}` : "",
    response.hint ? `Hint: ${response.hint}` : "",
    error?.message ? `Meta error: ${error.message}` : "",
    error?.type ? `Error type: ${error.type}` : "",
    error?.code ? `Error code: ${error.code}` : "",
    error?.error_subcode ? `Error subcode: ${error.error_subcode}` : "",
    error?.fbtrace_id ? `Meta trace ID: ${error.fbtrace_id}` : "",
  ].filter(Boolean);

  if (lines.length > 3) return lines;
  if (typeof response === "string") return [...lines, response];

  const fallback = Object.entries(response)
    .filter(([, value]) => value !== undefined && value !== null && typeof value !== "object")
    .map(([key, value]) => `${key.replaceAll("_", " ")}: ${String(value)}`);

  return [...lines, ...fallback].filter(Boolean);
}

export default function MetaFlows() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [responseSearch, setResponseSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState<any>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("LEAD_GENERATION");
  const [endpointUri, setEndpointUri] = useState("");
  const [editorMode, setEditorMode] = useState("builder");
  const [builder, setBuilder] = useState<any>(defaultBuilder);
  const [previewSelectedPath, setPreviewSelectedPath] = useState<number[]>([]);
  const [previewPendingIndex, setPreviewPendingIndex] = useState<number | null>(null);
  const [flowValidationIssues, setFlowValidationIssues] = useState<string[]>([]);
  const [isAutoFixing, setIsAutoFixing] = useState(false);
  const [flowJsonText, setFlowJsonText] = useState(JSON.stringify(starterFlow, null, 2));
  const [countryCode, setCountryCode] = useState("91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedContactKeys, setSelectedContactKeys] = useState<string[]>([]);
  const [contactsDropdownOpen, setContactsDropdownOpen] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [sendResults, setSendResults] = useState<any[]>([]);
  const [headerText, setHeaderText] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [footerText, setFooterText] = useState("");

  const generatedFlowJson = useMemo(() => buildOptionFlow(builder), [builder]);
  const builderErrors = useMemo(() => validateBuilder(builder), [builder]);
  const flowsQuery = useQuery({
    queryKey: [API, search],
    queryFn: () => apiFetch(`?search=${encodeURIComponent(search)}&limit=100`),
  });
  const statsQuery = useQuery({ queryKey: [API, "stats"], queryFn: () => apiFetch("/stats") });
  const responsesQuery = useQuery({
    queryKey: [API, "responses", responseSearch],
    queryFn: () => apiFetch(`/responses?limit=100&search=${encodeURIComponent(responseSearch)}`),
  });
  const regularContactsQuery = useQuery({
    queryKey: ["/api/contacts"],
    enabled: sendOpen,
    queryFn: async () => {
      const res = await fetch("/api/contacts", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch contacts");
      return res.json();
    },
  });
  const importedContactsQuery = useQuery({
    queryKey: ["/api/broadcast/imported-contacts"],
    enabled: sendOpen,
    queryFn: async () => {
      const res = await fetch("/api/broadcast/imported-contacts", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch imported contacts");
      return res.json();
    },
  });
  const allContacts = useMemo(() => {
    const regular = Array.isArray(regularContactsQuery.data) ? regularContactsQuery.data : [];
    const imported = Array.isArray(importedContactsQuery.data) ? importedContactsQuery.data : [];
    const seenPhones = new Set();
    return [
      ...regular.map((contact: any) => ({ ...contact, __source: "contacts" })),
      ...imported.map((contact: any) => ({ ...contact, __source: "imported" })),
    ]
      .filter((contact: any) => contactPhone(contact))
      .filter((contact: any) => {
        const phone = digitsOnly(contactPhone(contact));
        if (seenPhones.has(phone)) return false;
        seenPhones.add(phone);
        return true;
      });
  }, [regularContactsQuery.data, importedContactsQuery.data]);
  const filteredContacts = useMemo(() => {
    const query = contactSearch.trim().toLowerCase();
    const source = query
      ? allContacts.filter((contact: any) => {
          const haystack = [
            contactName(contact),
            contactPhone(contact),
            ...(Array.isArray(contact?.tags) ? contact.tags : []),
          ].join(" ").toLowerCase();
          return haystack.includes(query);
        })
      : allContacts;
    return source.slice(0, 80);
  }, [allContacts, contactSearch]);
  const selectedContacts = useMemo(
    () => allContacts.filter((contact: any) => selectedContactKeys.includes(contactKey(contact, contact.__source))),
    [allContacts, selectedContactKeys]
  );
  const recipientPhones = useMemo(() => {
    const phones = [
      normalizeSendPhone(countryCode, phoneNumber),
      ...selectedContacts.map((contact: any) => normalizeSendPhone(countryCode, contactPhone(contact))),
    ].filter(Boolean);
    return Array.from(new Set(phones));
  }, [countryCode, phoneNumber, selectedContacts]);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: [API] });

  const syncMutation = useMutation({
    mutationFn: () => apiFetch("/sync", { method: "POST" }),
    onSuccess: (data) => { invalidate(); toast.success(`Meta sync complete: ${data.synced || 0} flow(s)`); },
    onError: (error: Error) => toast.error(error.message),
  });
  const createMutation = useMutation({
    mutationFn: async () => {
      if (builderErrors.length) {
        throw new Error(`Complete the Flow form first:\n${builderErrors.join("\n")}`);
      }
      const validation = await apiFetch("/validate-json", {
        method: "POST",
        body: JSON.stringify({ flowJson: generatedFlowJson }),
      });
      if (!validation.valid) {
        throw new Error(`Flow form has validation errors:\n${validation.errors.join("\n")}`);
      }
      const created = await apiFetch("/create", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(), categories: [category],
          endpointUri: endpointUri.trim() || undefined,
          flowJson: generatedFlowJson,
        }),
      });
      if (!endpointUri.trim() && created.flow?._id) {
        try {
          const endpoint = await apiFetch(`/${created.flow._id}/endpoint/setup`, {
            method: "POST",
          });
          return { ...created, flow: endpoint.flow, endpointUri: endpoint.endpointUri };
        } catch (error) {
          return {
            ...created,
            endpointSetupError: (error as Error).message,
          };
        }
      }
      return created;
    },
    onSuccess: (data) => {
      setFlowValidationIssues([]);
      invalidate();
      setCreateOpen(false);
      setSelectedFlow(data.flow);
      setFlowJsonText(JSON.stringify(generatedFlowJson, null, 2));
      setEditorMode("builder");
      setPreviewSelectedPath([]);
      setPreviewPendingIndex(null);
      setEditorOpen(true);
      setName("");
      setEndpointUri("");
      if (data.endpointSetupError) {
        setFlowValidationIssues(parseFlowIssues(data.endpointSetupError));
        toast.warning("Draft created. Configure the secure endpoint before publishing.");
      } else {
        toast.success("Draft Flow created in Meta with secure endpoint");
      }
    },
    onError: (error: Error) => {
      setFlowValidationIssues(parseFlowIssues(error.message));
      toast.error(error.message, { duration: 9000 });
    },
  });
  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      if (editorMode === "builder" && builderErrors.length) {
        throw new Error(`Complete the Flow form first:\n${builderErrors.join("\n")}`);
      }
      const flowJson = editorMode === "builder" ? generatedFlowJson : JSON.parse(flowJsonText);
      const validation = await apiFetch("/validate-json", {
        method: "POST", body: JSON.stringify({ flowJson }),
      });
      if (!validation.valid) throw new Error(validation.errors.join("\n"));
      return apiFetch(`/${selectedFlow._id}/draft`, {
        method: "POST",
        body: JSON.stringify({
          flowJson,
          flowData: editorMode === "builder" ? { type: "option_response", ...builder } : undefined,
        }),
      });
    },
    onSuccess: (data) => {
      setFlowValidationIssues([]);
      invalidate();
      setSelectedFlow(data.flow);
      setFlowJsonText(JSON.stringify(editorMode === "builder" ? generatedFlowJson : JSON.parse(flowJsonText), null, 2));
      toast.success("Flow draft saved");
    },
    onError: (error: Error) => {
      setFlowValidationIssues(parseFlowIssues(error.message));
      toast.error(error.message, { duration: 9000 });
    },
  });
  const publishMutation = useMutation({
    mutationFn: async () => {
      await saveDraftMutation.mutateAsync();
      return apiFetch(`/${selectedFlow._id}/publish-meta`, { method: "POST" });
    },
    onSuccess: () => { invalidate(); setEditorOpen(false); toast.success("Flow published"); },
    onError: (error: Error) => {
      setFlowValidationIssues(parseFlowIssues(error.message));
      toast.error(error.message, { duration: 9000 });
    },
  });
  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFlow?._id) throw new Error("Select a flow first");
      if (!recipientPhones.length) throw new Error("Enter a phone number or select contacts");

      const results = [];
      for (const phone of recipientPhones) {
        const response = await fetch(`${API}/${selectedFlow._id}/send-conversation`, {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phoneNumber: phone,
            headerText: headerText || undefined,
            bodyText: bodyText || undefined,
            footerText: footerText || undefined,
          }),
        });
        const data = await response.json().catch(() => ({
          message: "No JSON response returned",
        }));
        results.push({
          phone,
          ok: response.ok,
          status: response.status,
          response: data,
        });
      }
      return results;
    },
    onSuccess: (data) => {
      setSendResults(data);
      const sentCount = data.filter((item: any) => item.ok).length;
      const failedCount = data.length - sentCount;
      if (sentCount) toast.success(`Flow sent to ${sentCount} recipient(s).`);
      if (failedCount) {
        toast.error(`${failedCount} recipient(s) failed. Check Meta response in popup.`, { duration: 9000 });
      }
    },
    onError: (error: Error) => {
      setSendResults([{ phone: "", ok: false, status: "client_error", response: { message: error.message } }]);
      toast.error(error.message, { duration: 9000 });
    },
  });
  const useSimpleMutation = (path: (flow: any) => string, method: string, message: string, body?: (flow: any) => any) =>
    useMutation({
      mutationFn: (flow: any) => apiFetch(path(flow), {
        method,
        body: body ? JSON.stringify(body(flow)) : undefined,
      }),
      onSuccess: () => { invalidate(); toast.success(message); },
      onError: (error: Error) => toast.error(error.message),
    });
  const cloneMutation = useSimpleMutation(
    (flow) => `/${flow._id}/clone`, "POST", "Flow cloned as draft",
    (flow) => ({ name: `${flow.name} Copy`, categories: flow.categories })
  );
  const deprecateMutation = useSimpleMutation((flow) => `/${flow._id}/deprecate`, "POST", "Flow deprecated");
  const deleteMutation = useSimpleMutation((flow) => `/${flow._id}/meta`, "DELETE", "Draft Flow deleted");

  const updateOptionAtPath = (path: number[], patch: Partial<BuilderOption>) =>
    setBuilder((current: any) => ({
      ...current,
      options: updateOptionTree(current.options, path, (option) => ({ ...option, ...patch })),
    }));
  const removeOptionAtPath = (path: number[]) => {
    setBuilder((current: any) => ({
      ...current,
      options: removeOptionFromTree(current.options, path),
    }));
    setPreviewSelectedPath([]);
    setPreviewPendingIndex(null);
  };
  const addChildOptionAtPath = (path: number[]) =>
    setBuilder((current: any) => ({
      ...current,
      options: updateOptionTree(current.options, path, (option) => ({
        ...option,
        options: [...(option.options || []), newBuilderOption((option.options || []).length + 1)],
      })),
    }));

  const fixFlowErrorsAutomatically = async () => {
    setIsAutoFixing(true);
    const fixedBuilder = {
      ...builder,
      options: normalizeOptions(builder.options || defaultOptions),
    };
    const fixedJson = buildOptionFlow(fixedBuilder);
    try {
      let updatedFlow = selectedFlow;
      const needsEndpoint = flowValidationIssues.some((issue) =>
        /endpoint_uri|endpoint url/i.test(issue)
      ) || !selectedFlow?.endpointUri;
      if (needsEndpoint) {
        const endpoint = await apiFetch(`/${selectedFlow._id}/endpoint/setup`, {
          method: "POST",
        });
        updatedFlow = endpoint.flow;
      }
      const validation = await apiFetch("/validate-json", {
        method: "POST",
        body: JSON.stringify({ flowJson: fixedJson }),
      });
      if (!validation.valid) {
        throw new Error(validation.errors.join("\n"));
      }
      const result = await apiFetch(`/${selectedFlow._id}/draft`, {
        method: "POST",
        body: JSON.stringify({
          flowJson: fixedJson,
          flowData: { type: "option_response", ...fixedBuilder },
        }),
      });
      setBuilder(fixedBuilder);
      setFlowJsonText(JSON.stringify(fixedJson, null, 2));
      setSelectedFlow({ ...updatedFlow, ...result.flow });
      setEditorMode("builder");
      setPreviewSelectedPath([]);
      setPreviewPendingIndex(null);
      setFlowValidationIssues([]);
      invalidate();
      toast.success("Flow errors fixed and corrected draft saved to Meta.");
    } catch (error) {
      const message = (error as Error).message;
      setFlowValidationIssues(parseFlowIssues(message));
      toast.error(message, { duration: 9000 });
    } finally {
      setIsAutoFixing(false);
    }
  };

  const openEditor = async (flow: any) => {
    setSelectedFlow(flow);
    setEditorOpen(true);
    setPreviewSelectedPath([]);
    setPreviewPendingIndex(null);
    setEditorMode(flow.flowData?.type === "option_response" ? "builder" : "json");
    if (flow.flowData?.type === "option_response") {
      const legacyMessage = [
        flow.flowData.heading,
        flow.flowData.description,
        flow.flowData.question,
      ].filter(Boolean).join("\n\n");
      setBuilder({
        ...defaultBuilder,
        ...flow.flowData,
        message: flow.flowData.message || legacyMessage || defaultBuilder.message,
        options: normalizeOptions(flow.flowData.options || defaultOptions),
      });
    }
    setFlowJsonText(JSON.stringify(flow.flowJson || starterFlow, null, 2));
    try {
      const asset = await apiFetch(`/${flow._id}/assets/flow.json/download`);
      if (asset.json) setFlowJsonText(JSON.stringify(asset.json, null, 2));
    } catch {
      // New drafts may not have a remote asset yet.
    }
  };

  const flows = flowsQuery.data?.flows || [];
  const responses = responsesQuery.data?.responses || [];
  const stats = statsQuery.data || {};
  const cards = [
    ["Total Flows", stats.totalFlows || 0], ["Published", stats.publishedFlows || 0],
    ["Drafts", stats.draftFlows || 0], ["Responses", responsesQuery.data?.total || 0],
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">WhatsApp Flows</h1>
          <p className="text-muted-foreground">Build option-based journeys, publish, send and view customer answers.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
            {syncMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Sync Meta
          </Button>
          <Button onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" />Create Flow</Button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <Card key={label}><CardContent className="p-5"><div className="text-2xl font-bold">{value}</div><div className="text-sm text-muted-foreground">{label}</div></CardContent></Card>
        ))}
      </div>

      <Tabs defaultValue="flows">
        <TabsList><TabsTrigger value="flows">Flows</TabsTrigger><TabsTrigger value="responses">Customer Responses</TabsTrigger></TabsList>
        <TabsContent value="flows" className="space-y-4">
          <div className="relative max-w-md"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search flows..." className="pl-9" /></div>
          {flowsQuery.isLoading ? <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin" /></div> :
            flows.length === 0 ? <Card><CardContent className="py-16 text-center text-muted-foreground">No Meta WhatsApp Flows found.</CardContent></Card> :
            <div className="grid gap-4 lg:grid-cols-2">
              {flows.map((flow: any) => (
                <Card key={flow._id}>
                  <CardHeader className="pb-3"><div className="flex items-start justify-between gap-3"><div><CardTitle className="text-lg">{flow.name}</CardTitle><div className="mt-1 text-xs text-muted-foreground">Meta ID: {flow.flowId}</div></div>{statusBadge(flow.status)}</div></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">{(flow.categories || []).map((item: string) => <Badge key={item} variant="outline">{item.replaceAll("_", " ")}</Badge>)}</div>
                    {flow.validationErrors?.length > 0 && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{flow.validationErrors.join(", ")}</div>}
                    <div className="flex flex-wrap gap-2">
                      {flow.status === "DRAFT" && <Button size="sm" onClick={() => openEditor(flow)}><WandSparkles className="mr-2 h-4 w-4" />Edit Flow</Button>}
                      <Button size="sm" variant="outline" onClick={() => { setSelectedFlow(flow); setSendResults([]); setSelectedContactKeys([]); setContactSearch(""); setPhoneNumber(""); setCountryCode("91"); setSendOpen(true); }}><Send className="mr-2 h-4 w-4" />Send</Button>
                      {flow.previewUrl && <Button size="sm" variant="outline" onClick={() => window.open(flow.previewUrl, "_blank")}><ExternalLink className="mr-2 h-4 w-4" />Preview</Button>}
                      <Button size="sm" variant="ghost" onClick={() => cloneMutation.mutate(flow)}><Copy className="h-4 w-4" /></Button>
                      {flow.status === "DRAFT" ? <Button size="sm" variant="ghost" className="text-red-600" onClick={() => deleteMutation.mutate(flow)}><Trash2 className="h-4 w-4" /></Button> :
                        flow.status === "PUBLISHED" ? <Button size="sm" variant="ghost" onClick={() => deprecateMutation.mutate(flow)}>Deprecate</Button> : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>}
        </TabsContent>
        <TabsContent value="responses" className="space-y-4">
          <div className="relative max-w-md"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={responseSearch} onChange={(e) => setResponseSearch(e.target.value)} placeholder="Search customer, phone or flow..." className="pl-9" /></div>
          {responsesQuery.isLoading ? <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin" /></div> :
            responses.length === 0 ? <Card><CardContent className="py-16 text-center text-muted-foreground">No Flow responses received yet.</CardContent></Card> :
            <div className="space-y-3">{responses.map((response: any) => (
              <Card key={response.id}><CardContent className="p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><div className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4 text-emerald-600" />{response.flowName || "WhatsApp Flow submission"}</div><div className="mt-1 text-sm text-muted-foreground">{response.contactName || response.contactPhone} · {response.contactPhone}</div></div><div className="text-xs text-muted-foreground">{new Date(response.receivedAt).toLocaleString()}</div></div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">{prettyAnswers(response.responseJson).map(([key, value]) => <div key={key} className="rounded-md border bg-muted/30 p-3"><div className="text-xs font-medium uppercase text-muted-foreground">{key.replaceAll("_", " ")}</div><div className="mt-1 break-words text-sm">{typeof value === "object" ? JSON.stringify(value) : String(value)}</div></div>)}</div>
              </CardContent></Card>
            ))}</div>}
        </TabsContent>
      </Tabs>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Create Meta WhatsApp Flow</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <div className="font-medium">What these parameters mean</div>
              <p className="mt-1 text-muted-foreground"><b>Flow name:</b> internal Meta name. <b>Category:</b> business use case. <b>Endpoint URL:</b> only for live server data; option-based conditional responses do not need it.</p>
            </div>
            <div className="space-y-2"><Label>Flow name *</Label><Input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="Product enquiry flow" /><p className="text-xs text-muted-foreground">1–80 characters.</p></div>
            <div className="space-y-2"><Label>Category *</Label><Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categories.map((item) => <SelectItem key={item} value={item}>{item.replaceAll("_", " ")}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Endpoint URL (optional)</Label><Input value={endpointUri} onChange={(e) => setEndpointUri(e.target.value)} placeholder="https://api.example.com/whatsapp/flows" /><p className="text-xs text-muted-foreground">Leave blank unless options or responses must be fetched from your server in real time.</p></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={() => createMutation.mutate()} disabled={!name.trim() || createMutation.isPending}>{createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-h-[94vh] max-w-[96vw] overflow-y-auto xl:max-w-7xl">
          <DialogHeader><DialogTitle>Edit WhatsApp Flow — {selectedFlow?.name}</DialogTitle></DialogHeader>
          <Tabs value={editorMode} onValueChange={setEditorMode}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <TabsList><TabsTrigger value="builder"><WandSparkles className="mr-2 h-4 w-4" />Visual Builder</TabsTrigger><TabsTrigger value="json"><FileJson className="mr-2 h-4 w-4" />Advanced JSON</TabsTrigger></TabsList>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const resetBuilder = {
                    ...defaultBuilder,
                    options: normalizeOptions(defaultOptions),
                  };
                  setBuilder(resetBuilder);
                  setFlowJsonText(JSON.stringify(buildOptionFlow(resetBuilder), null, 2));
                  setPreviewSelectedPath([]);
                  setPreviewPendingIndex(null);
                  setEditorMode("builder");
                  toast.success("Flow builder reset to default");
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />Reset to default
              </Button>
            </div>
            <TabsContent value="builder">
              <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-5">
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  value={builder.message || ""}
                  maxLength={1024}
                  onChange={(e) => setBuilder({ ...builder, message: e.target.value })}
                  placeholder="How can we help you?"
                  className="min-h-28"
                />
                <p className="text-xs text-muted-foreground">This message is sent with the reply options shown below.</p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between gap-3"><div><Label>Banner image (optional)</Label><p className="text-xs text-muted-foreground">PNG/JPG/JPEG/JFIF, maximum 300 KB.</p></div><label className="cursor-pointer"><Input type="file" accept=".png,.jpg,.jpeg,.jfif,image/png,image/jpeg" className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; try { setBuilder({ ...builder, bannerImage: await fileToBase64(file) }); } catch (error) { toast.error((error as Error).message); } }} /><Button type="button" variant="outline" asChild><span><ImagePlus className="mr-2 h-4 w-4" />Choose image</span></Button></label></div>
                {builder.bannerImage && <Button className="mt-3" size="sm" variant="ghost" onClick={() => setBuilder({ ...builder, bannerImage: "" })}>Remove banner</Button>}
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between"><div><Label>Reply buttons and next steps</Label><p className="text-xs text-muted-foreground">Maximum 3 buttons per WhatsApp message. Each button can send a response or open another set.</p></div><Button variant="outline" disabled={builder.options.length >= 3} onClick={() => setBuilder({ ...builder, options: [...builder.options, newBuilderOption(builder.options.length + 1)] })}><Plus className="mr-2 h-4 w-4" />Add button</Button></div>
                {builder.options.map((option: BuilderOption, index: number) => (
                  <OptionEditor
                    key={`${option.id}-${index}`}
                    option={option}
                    index={index}
                    path={[index]}
                    depth={0}
                    canDelete={builder.options.length > 2}
                    updateAtPath={updateOptionAtPath}
                    removeAtPath={removeOptionAtPath}
                    addChildAtPath={addChildOptionAtPath}
                  />
                ))}
              </div>
                  {flowValidationIssues.length > 0 && (
                    <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-900">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold">Meta Flow issues</div>
                          <div className="mt-1 text-xs text-red-700">
                            Review the fix below, or apply the safe technical fixes automatically.
                          </div>
                        </div>
                        <Button type="button" size="sm" onClick={fixFlowErrorsAutomatically} disabled={isAutoFixing}>
                          {isAutoFixing
                            ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            : <WandSparkles className="mr-2 h-4 w-4" />}
                          Fix errors automatically
                        </Button>
                      </div>
                      <div className="mt-3 space-y-3">
                        {flowValidationIssues.map((issue, index) => (
                          <div key={`${index}-${issue}`} className="rounded-md border border-red-200 bg-white p-3">
                            <div className="font-medium">{issue}</div>
                            <div className="mt-1 text-xs text-slate-700">
                              <span className="font-semibold">How to fix:</span> {flowIssueHelp(issue)}
                            </div>
                          </div>
                        ))}
                      </div>
                      {selectedFlow?.endpointUri && (
                        <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
                          <div className="font-semibold">Configured Flow endpoint</div>
                          <div className="mt-1 break-all font-mono">{selectedFlow.endpointUri}</div>
                          <div className="mt-1">Encrypted endpoint data is assigned to this dashboard account.</div>
                        </div>
                      )}
                    </div>
                  )}
                  {builderErrors.length > 0 ? (
                    <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                      <div className="mb-1 font-semibold">Fix these issues before saving or publishing:</div>
                      <ul className="list-disc space-y-1 pl-5">
                        {builderErrors.map((error, index) => <li key={`${index}-${error}`}>{error}</li>)}
                      </ul>
                    </div>
                  ) : (
                    <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
                      Flow form is valid. Save Draft will run the Meta JSON validation before uploading.
                    </div>
                  )}
                </div>
                <div className="xl:sticky xl:top-0">
                  <PhoneFlowPreview
                    builder={builder}
                    selectedPath={previewSelectedPath}
                    pendingIndex={previewPendingIndex}
                    onSelect={(index) => {
                      setPreviewSelectedPath((path) => [...path, index]);
                      setPreviewPendingIndex(null);
                    }}
                    onContinue={() => undefined}
                    onBack={() => {
                      setPreviewSelectedPath((path) => path.slice(0, -1));
                      setPreviewPendingIndex(null);
                    }}
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="json"><div className="mb-2 flex justify-end"><Button variant="outline" size="sm" onClick={() => setFlowJsonText(JSON.stringify(generatedFlowJson, null, 2))}>Generate JSON from builder</Button></div><Textarea value={flowJsonText} onChange={(e) => setFlowJsonText(e.target.value)} className="min-h-[560px] font-mono text-xs" spellCheck={false} /></TabsContent>
          </Tabs>
          <DialogFooter><Button variant="outline" onClick={() => saveDraftMutation.mutate()} disabled={saveDraftMutation.isPending}>{saveDraftMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Draft</Button><Button onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}><Rocket className="mr-2 h-4 w-4" />Publish</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={sendOpen}
        onOpenChange={(open) => {
          if (!open && contactsDropdownOpen) return;
          setSendOpen(open);
          if (!open) {
            setContactsDropdownOpen(false);
            setSendResults([]);
          }
        }}
      >
        <DialogContent
          className="max-h-[92vh] max-w-2xl overflow-y-auto"
          onInteractOutside={(event) => {
            if (contactsDropdownOpen) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (contactsDropdownOpen) event.preventDefault();
          }}
          onFocusOutside={(event) => {
            if (contactsDropdownOpen) event.preventDefault();
          }}
        >
          <DialogHeader><DialogTitle>Send “{selectedFlow?.name}”</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Customer phone</Label>
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <Input value={countryCode} onChange={(e) => setCountryCode(digitsOnly(e.target.value))} placeholder="91" inputMode="numeric" />
                <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="9876543210" inputMode="tel" />
              </div>
              <p className="text-xs text-muted-foreground">Country code defaults to 91 and can be edited. Manual number and selected contacts are combined.</p>
            </div>
            <div className="space-y-2">
              <Label>Contacts</Label>
              <DropdownMenu modal={false} open={contactsDropdownOpen} onOpenChange={setContactsDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-between">
                    {selectedContactKeys.length ? `${selectedContactKeys.length} contact(s) selected` : "Select contacts"}
                    <span className="text-xs text-muted-foreground">{allContacts.length} available</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="flex max-h-[min(420px,calc(100vh-14rem))] w-[min(560px,calc(100vw-3rem))] flex-col overflow-hidden p-2"
                  align="start"
                  sideOffset={6}
                  onCloseAutoFocus={(event) => event.preventDefault()}
                  onWheel={(event) => event.stopPropagation()}
                >
                  <div className="flex items-center justify-between gap-2 px-2 py-1">
                    <DropdownMenuLabel className="p-0">Saved contacts</DropdownMenuLabel>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setContactsDropdownOpen(false)}>Done</Button>
                  </div>
                  <div className="px-2 pb-2">
                    <Input value={contactSearch} onChange={(e) => setContactSearch(e.target.value)} placeholder="Search name, phone or tag..." onKeyDown={(event) => event.stopPropagation()} />
                  </div>
                  <DropdownMenuSeparator />
                  <div className="min-h-0 flex-1 overflow-y-auto pr-1" onWheel={(event) => event.stopPropagation()}>
                    {(regularContactsQuery.isLoading || importedContactsQuery.isLoading) ? (
                      <div className="flex items-center justify-center py-6 text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading contacts</div>
                    ) : filteredContacts.length ? (
                      filteredContacts.map((contact: any) => {
                        const key = contactKey(contact, contact.__source);
                        return (
                          <DropdownMenuCheckboxItem
                            key={key}
                            checked={selectedContactKeys.includes(key)}
                            onCheckedChange={(checked) => {
                              setSelectedContactKeys((current) =>
                                checked ? Array.from(new Set([...current, key])) : current.filter((item) => item !== key)
                              );
                            }}
                            onSelect={(event) => event.preventDefault()}
                            className="items-start gap-2"
                          >
                            <div className="min-w-0">
                              <div className="truncate font-medium">{contactName(contact)}</div>
                              <div className="truncate text-xs text-muted-foreground">{contactPhone(contact)}</div>
                            </div>
                          </DropdownMenuCheckboxItem>
                        );
                      })
                    ) : (
                      <div className="px-2 py-6 text-center text-sm text-muted-foreground">No contacts found.</div>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <div className="flex items-center justify-between gap-2 pt-2">
                    <Button type="button" variant="ghost" size="sm" disabled={!selectedContactKeys.length} onClick={() => setSelectedContactKeys([])}>Clear selection</Button>
                    <Button type="button" size="sm" onClick={() => setContactsDropdownOpen(false)}>Done</Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <p className="text-xs text-muted-foreground">{recipientPhones.length} unique recipient(s) ready.</p>
            </div>
            <div className="space-y-2"><Label>Header (optional)</Label><Input value={headerText} onChange={(e) => setHeaderText(e.target.value)} /></div>
            <div className="space-y-2"><Label>Message override (optional)</Label><Textarea value={bodyText} onChange={(e) => setBodyText(e.target.value)} placeholder="Leave blank to use the message from the builder." /></div>
            <div className="space-y-2"><Label>Footer (optional)</Label><Input value={footerText} onChange={(e) => setFooterText(e.target.value)} /></div>
            <p className="text-xs text-muted-foreground">The customer will receive option buttons directly in chat. Button clicks automatically continue to the configured next step.</p>
            {sendResults.length ? (
              <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
                <div className="font-medium">Meta send response</div>
                {sendResults.map((result: any, index: number) => (
                  <div key={`${result.phone}-${index}`} className={`rounded-md border p-3 ${result.ok ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="font-semibold">{result.phone || "Request"}</span>
                      <Badge className={result.ok ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                        {result.ok ? "Sent" : "Failed"} - {result.status}
                      </Badge>
                    </div>
                    <div className={`space-y-1 rounded-md border p-3 text-sm ${result.ok ? "border-emerald-100 bg-white text-emerald-950" : "border-red-100 bg-white text-red-950"}`}>
                      {metaSendResponseText(result).map((line: string, lineIndex: number) => (
                        <div key={lineIndex} className="break-words leading-relaxed">{line}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setSendOpen(false)}>Cancel</Button><Button onClick={() => sendMutation.mutate()} disabled={!recipientPhones.length || sendMutation.isPending}>{sendMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}Send Options</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
