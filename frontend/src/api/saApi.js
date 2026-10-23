import { baseApi } from './baseApi'

function cleanParams(params = {}) {
  const out = {}
  for (const [k, v] of Object.entries(params)) {
    if (v == null || v === '' || v === 'all') continue
    out[k] = v
  }
  return out
}

export const saApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation({
      query: ({ phone, password }) => ({
        url: '/auth/login',
        method: 'POST',
        body: {
          phone: String(phone).replace(/[\s-]/g, '').trim(),
          password,
        },
      }),
    }),

    updateProfile: build.mutation({
      query: (body) => ({
        url: '/auth/profile',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Auth'],
    }),

    getOverview: build.query({
      query: () => '/reports/overview',
      providesTags: ['Reports'],
      transformResponse: (res) => res.report,
    }),

    getMembers: build.query({
      query: (params = {}) => ({
        url: '/members',
        params: cleanParams(params),
      }),
      providesTags: (result) =>
        result?.members
          ? [
              ...result.members.map((m) => ({ type: 'Members', id: m.id })),
              { type: 'Members', id: 'LIST' },
            ]
          : [{ type: 'Members', id: 'LIST' }],
    }),

    createMember: build.mutation({
      query: (body) => ({
        url: '/members',
        method: 'POST',
        body: { ...body, id: '' },
      }),
      invalidatesTags: [{ type: 'Members', id: 'LIST' }, 'Reports', 'Actions'],
    }),

    updateMember: build.mutation({
      query: ({ id, ...body }) => ({
        url: `/members/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Members', id: arg.id },
        { type: 'Members', id: 'LIST' },
        'Actions',
      ],
    }),

    deleteMember: build.mutation({
      query: (id) => ({
        url: `/members/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Members', id: 'LIST' }, 'Reports', 'Actions'],
    }),

    payMember: build.mutation({
      query: ({ id, plan, method, amount }) => ({
        url: `/members/${id}/pay`,
        method: 'POST',
        body: { plan, method, amount },
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Members', id: arg.id },
        { type: 'Members', id: 'LIST' },
        'Payments',
        'Reports',
        'Actions',
      ],
    }),

    getActions: build.query({
      query: (params = {}) => ({
        url: '/actions',
        params: cleanParams(params),
      }),
      providesTags: ['Actions'],
    }),

    getPayments: build.query({
      query: (params = {}) => ({
        url: '/payments',
        params: cleanParams(params),
      }),
      providesTags: ['Payments'],
    }),

    getExpenses: build.query({
      query: (params = {}) => ({
        url: '/expenses',
        params: cleanParams(params),
      }),
      providesTags: ['Expenses'],
    }),

    createExpense: build.mutation({
      query: (body) => ({
        url: '/expenses',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Expenses', 'Reports', 'Actions'],
    }),

    deleteExpense: build.mutation({
      query: (id) => ({
        url: `/expenses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Expenses', 'Reports', 'Actions'],
    }),

    getAdmins: build.query({
      query: () => '/admins',
      providesTags: ['Admins'],
      transformResponse: (res) => res.admins || [],
    }),

    createAdmin: build.mutation({
      query: (body) => ({
        url: '/admins',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Admins', 'Actions'],
    }),

    updateAdmin: build.mutation({
      query: ({ id, ...body }) => ({
        url: `/admins/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Admins', 'Actions'],
    }),

    deleteAdmin: build.mutation({
      query: (id) => ({
        url: `/admins/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Admins', 'Actions'],
    }),

    setAdminActive: build.mutation({
      query: ({ id, isActive }) => ({
        url: `/admins/${id}/active`,
        method: 'PATCH',
        body: { isActive },
      }),
      invalidatesTags: ['Admins'],
    }),

    getNotificationQueue: build.query({
      query: () => '/notifications/queue',
      providesTags: ['Notifications'],
      transformResponse: (res) => res.queue,
    }),

    getNotificationHistory: build.query({
      query: (params = {}) => ({
        url: '/notifications/history',
        params: cleanParams(params),
      }),
      providesTags: ['Notifications'],
    }),
  }),
})

export const {
  useLoginMutation,
  useUpdateProfileMutation,
  useGetOverviewQuery,
  useGetMembersQuery,
  useLazyGetMembersQuery,
  useCreateMemberMutation,
  useUpdateMemberMutation,
  useDeleteMemberMutation,
  usePayMemberMutation,
  useGetActionsQuery,
  useLazyGetActionsQuery,
  useGetPaymentsQuery,
  useGetExpensesQuery,
  useCreateExpenseMutation,
  useDeleteExpenseMutation,
  useGetAdminsQuery,
  useCreateAdminMutation,
  useUpdateAdminMutation,
  useDeleteAdminMutation,
  useSetAdminActiveMutation,
  useGetNotificationQueueQuery,
  useGetNotificationHistoryQuery,
} = saApi
