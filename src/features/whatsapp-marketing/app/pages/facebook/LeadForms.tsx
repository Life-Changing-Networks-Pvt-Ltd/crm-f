// @ts-nocheck
import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Mail,
  Phone,
  Calendar,
  Tag,
  CheckCircle,
  FileText,
  RefreshCw,
  Search,
  Filter,
  PanelsTopLeft as Facebook,
} from "lucide-react";
import api from "@/lib/axios";

// --- Types ---
interface LeadField {
  name: string;
  values: string[];
}

interface Lead {
  id: string;
  created_time: string;
  field_data: LeadField[];
}

interface LeadgenForm {
  id: string;
  name?: string;
  status?: string;
}

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category: string;
}

interface NormalizedLead {
  id: string;
  created_time: string;
  FULL_NAME?: string;
  EMAIL?: string;
  PHONE?: string;
  DOB?: string;
  CATEGORY?: string;
  OPT_IN?: string;
  [key: string]: string | undefined;
}

const FacebookLeadsManager: React.FC = () => {
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  
  const [forms, setForms] = useState<LeadgenForm[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  
  const [leads, setLeads] = useState<NormalizedLead[]>([]);
  
  const [loadingPages, setLoadingPages] = useState(false);
  const [loadingForms, setLoadingForms] = useState(false);
  const [loadingLeads, setLoadingLeads] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterOptIn, setFilterOptIn] = useState("all");

  useEffect(() => {
    loadPages();
  }, []);

  // --- Fetch Pages ---
  const loadPages = async () => {
    try {
      setLoadingPages(true);
      setError(null);
      const res = await api.get("/facebook-marketing/pages");
      setPages(res.data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoadingPages(false);
    }
  };

  // --- Handle Page Select ---
  const handlePageSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    if (!pId) {
      setSelectedPageId(null);
      setForms([]);
      setSelectedFormId(null);
      setLeads([]);
      return;
    }
    
    setSelectedPageId(pId);
    setSelectedFormId(null);
    setLeads([]);
    
    try {
      setLoadingForms(true);
      setError(null);
      const res = await api.get(`/facebook-marketing/pages/${pId}/forms`);
      setForms(res.data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoadingForms(false);
    }
  };

  // --- Fetch all leads with auto-pagination ---
  const fetchAllLeads = async (formId: string): Promise<Lead[]> => {
    let allLeads: Lead[] = [];
    let after: string | null = null;
    let hasMore = true;

    while (hasMore) {
      try {
        const res = await api.get(`/facebook-marketing/pages/${selectedPageId}/forms/${formId}/leads`, {
          params: { limit: 100, ...(after ? { after } : {}) }
        });
        const data = res.data?.data;
        if (!data) break;

        allLeads = allLeads.concat(data.data || []);
        after = data.paging?.cursors?.after || null;
        hasMore = !!after;
      } catch (err) {
        throw new Error((err as any).response?.data?.message || (err as Error).message);
      }
    }

    return allLeads;
  };

  // --- Normalize lead field_data into flat object ---
  const normalizeLead = (lead: Lead): NormalizedLead => {
    const normalized: NormalizedLead = {
      id: lead.id,
      created_time: lead.created_time,
    };

    lead.field_data.forEach((field) => {
      const key = field.name;
      const value = field.values?.[0] || "";
      if (key === "0") {
        normalized.CATEGORY = value;
      } else if (key === "1") {
        normalized.OPT_IN = value;
      } else {
        normalized[key] = value;
      }
    });

    return normalized;
  };

  // --- Handle Form Click ---
  const handleFormClick = async (formId: string) => {
    if (selectedFormId === formId) return;
    setSelectedFormId(formId);
    setLoadingLeads(true);
    setError(null);

    try {
      const rawLeads = await fetchAllLeads(formId);
      const normalizedLeads = rawLeads.map(normalizeLead);
      setLeads(normalizedLeads);
    } catch (err: any) {
      setError(err.message);
      setLeads([]);
    } finally {
      setLoadingLeads(false);
    }
  };

  // Stats calculations
  const totalLeads = leads.length;
  const leadsWithEmail = leads.filter((l) => l.EMAIL).length;
  const leadsWithPhone = leads.filter((l) => l.PHONE).length;
  const optedInLeads = leads.filter(
    (l) => l.OPT_IN?.toLowerCase() === "yes" || l.OPT_IN === "1"
  ).length;

  // Get unique categories for filter dropdown
  const uniqueCategories = useMemo(() => {
    const categories = leads.map((l) => l.CATEGORY).filter(Boolean);
    return Array.from(new Set(categories));
  }, [leads]);

  // Filtered and searched leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        lead.FULL_NAME?.toLowerCase().includes(searchLower) ||
        lead.EMAIL?.toLowerCase().includes(searchLower) ||
        lead.PHONE?.toLowerCase().includes(searchLower) ||
        lead.CATEGORY?.toLowerCase().includes(searchLower);

      // Category filter
      const matchesCategory =
        filterCategory === "all" || lead.CATEGORY === filterCategory;

      // Opt-in filter
      const isOptedIn =
        lead.OPT_IN?.toLowerCase() === "yes" || lead.OPT_IN === "1";
      const matchesOptIn =
        filterOptIn === "all" ||
        (filterOptIn === "yes" && isOptedIn) ||
        (filterOptIn === "no" && !isOptedIn);

      return matchesSearch && matchesCategory && matchesOptIn;
    });
  }, [leads, searchQuery, filterCategory, filterOptIn]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users className="text-blue-600" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Facebook Leads Manager
              </h1>
              <p className="text-gray-500 mt-1 text-lg">
                Select your page and manage your lead generation forms
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Page Selector */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Facebook Page
                </label>
                <div className="relative">
                  <Facebook className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600" size={18} />
                  <select
                    value={selectedPageId || ""}
                    onChange={handlePageSelect}
                    disabled={loadingPages}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                  >
                    <option value="">Select a page...</option>
                    {pages.map((page) => (
                      <option key={page.id} value={page.id}>
                        {page.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={loadPages}
                disabled={loadingPages}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition flex items-center gap-2 h-[42px]"
              >
                {loadingPages ? <RefreshCw className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                Refresh Pages
              </button>
            </div>
            {error && !selectedPageId && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">Error: {error}</p>
              </div>
            )}
          </div>

          {selectedPageId && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Forms Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <FileText className="text-blue-600" size={24} />
                      Lead Forms
                    </h2>
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                      {forms.length}
                    </span>
                  </div>

                  {loadingForms ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw
                        className="animate-spin text-blue-600"
                        size={32}
                      />
                    </div>
                  ) : error && !loadingLeads ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-700 text-sm">Error: {error}</p>
                    </div>
                  ) : forms.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No forms found for this page
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {forms.map((form) => (
                        <button
                          key={form.id}
                          onClick={() => handleFormClick(form.id)}
                          className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                            selectedFormId === form.id
                              ? "bg-blue-50 border-blue-500 shadow-md"
                              : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm"
                          }`}
                        >
                          <div className="font-medium text-gray-900 mb-1">
                            {form.name || "Unnamed Form"}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            ID: {form.id.slice(0, 20)}...
                          </div>
                          {form.status && (
                            <div className="mt-2">
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  form.status === "ACTIVE"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {form.status}
                              </span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Leads Content */}
              <div className="lg:col-span-2">
                {/* Search and Filter Bar */}
                {selectedFormId && !loadingLeads && leads.length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg p-4 mb-6 border border-gray-100">
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Search Bar */}
                      <div className="relative">
                        <Search
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                          size={20}
                        />
                        <input
                          type="text"
                          placeholder="Search by name, email, phone, category..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                      </div>

                      {/* Filter Controls */}
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Filter
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            size={18}
                          />
                          <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                          >
                            <option value="all">All Categories</option>
                            {uniqueCategories.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="relative flex-1">
                          <CheckCircle
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            size={18}
                          />
                          <select
                            value={filterOptIn}
                            onChange={(e) => setFilterOptIn(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                          >
                            <option value="all">All Opt-in</option>
                            <option value="yes">Opted In</option>
                            <option value="no">Not Opted In</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 min-h-[600px]">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <Users className="text-blue-600" size={24} />
                      Lead Submissions
                    </h2>
                    {selectedFormId && !loadingLeads && (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium border border-green-200">
                        {filteredLeads.length} Total
                      </span>
                    )}
                  </div>

                  {!selectedFormId ? (
                    <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
                      <Users size={64} className="mb-4 text-gray-300" />
                      <p className="text-lg">Select a form to view leads.</p>
                    </div>
                  ) : loadingLeads ? (
                    <div className="flex flex-col items-center justify-center h-[400px]">
                      <RefreshCw
                        className="animate-spin text-blue-600 mb-4"
                        size={40}
                      />
                      <p className="text-gray-500">Loading leads data...</p>
                    </div>
                  ) : error ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-700 text-sm">
                        Error loading leads: {error}
                      </p>
                    </div>
                  ) : filteredLeads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
                      <FileText size={64} className="mb-4 text-gray-300" />
                      <p className="text-lg">
                        {leads.length === 0
                          ? "No leads found for this form."
                          : "No leads match your search criteria."}
                      </p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {filteredLeads.map((lead) => (
                        <div
                          key={lead.id}
                          className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
                        >
                          {/* Header section with Name and Date */}
                          <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100">
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-700 transition-colors">
                                {lead.FULL_NAME || "Anonymous"}
                              </h3>
                              <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                <Calendar size={14} />
                                {new Date(lead.created_time).toLocaleString(
                                  undefined,
                                  {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                  }
                                )}
                              </div>
                            </div>
                            {lead.CATEGORY && (
                              <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-md text-xs font-medium uppercase tracking-wider">
                                {lead.CATEGORY}
                              </span>
                            )}
                          </div>

                          {/* Contact Info */}
                          <div className="space-y-2.5">
                            {lead.EMAIL && (
                              <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-2 rounded-lg">
                                <Mail size={16} className="text-gray-400" />
                                <span className="text-sm font-medium truncate">
                                  {lead.EMAIL}
                                </span>
                              </div>
                            )}
                            {lead.PHONE && (
                              <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-2 rounded-lg">
                                <Phone size={16} className="text-gray-400" />
                                <span className="text-sm font-medium truncate">
                                  {lead.PHONE}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Additional Fields */}
                          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            {lead.DOB && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <span className="text-gray-400 font-medium">
                                  DOB:
                                </span>
                                <span>{lead.DOB}</span>
                              </div>
                            )}
                            {lead.OPT_IN && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <span className="text-gray-400 font-medium">
                                  Opt-in:
                                </span>
                                <span
                                  className={
                                    lead.OPT_IN.toLowerCase() === "yes" ||
                                    lead.OPT_IN === "1"
                                      ? "text-green-600 font-medium"
                                      : "text-gray-900"
                                  }
                                >
                                  {lead.OPT_IN}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacebookLeadsManager;
