

import type * as runtime from "@prisma/client/runtime/client"
import type * as $Enums from "../enums"
import type * as Prisma from "../internal/prismaNamespace"


export type LeadModel = runtime.Types.Result.DefaultSelection<Prisma.$LeadPayload>

export type AggregateLead = {
  _count: LeadCountAggregateOutputType | null
  _min: LeadMinAggregateOutputType | null
  _max: LeadMaxAggregateOutputType | null
}

export type LeadMinAggregateOutputType = {
  id: string | null
  tenantId: string | null
  fullName: string | null
  phone: string | null
  sessionId: string | null
  pageUrl: string | null
  createdAt: Date | null
}

export type LeadMaxAggregateOutputType = {
  id: string | null
  tenantId: string | null
  fullName: string | null
  phone: string | null
  sessionId: string | null
  pageUrl: string | null
  createdAt: Date | null
}

export type LeadCountAggregateOutputType = {
  id: number
  tenantId: number
  fullName: number
  phone: number
  sessionId: number
  pageUrl: number
  extra: number
  createdAt: number
  _all: number
}


export type LeadMinAggregateInputType = {
  id?: true
  tenantId?: true
  fullName?: true
  phone?: true
  sessionId?: true
  pageUrl?: true
  createdAt?: true
}

export type LeadMaxAggregateInputType = {
  id?: true
  tenantId?: true
  fullName?: true
  phone?: true
  sessionId?: true
  pageUrl?: true
  createdAt?: true
}

export type LeadCountAggregateInputType = {
  id?: true
  tenantId?: true
  fullName?: true
  phone?: true
  sessionId?: true
  pageUrl?: true
  extra?: true
  createdAt?: true
  _all?: true
}

export type LeadAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  where?: Prisma.LeadWhereInput
  orderBy?: Prisma.LeadOrderByWithRelationInput | Prisma.LeadOrderByWithRelationInput[]
  cursor?: Prisma.LeadWhereUniqueInput
  take?: number
  skip?: number
  _count?: true | LeadCountAggregateInputType
  _min?: LeadMinAggregateInputType
  _max?: LeadMaxAggregateInputType
}

export type GetLeadAggregateType<T extends LeadAggregateArgs> = {
      [P in keyof T & keyof AggregateLead]: P extends '_count' | 'count'
    ? T[P] extends true
      ? number
      : Prisma.GetScalarType<T[P], AggregateLead[P]>
    : Prisma.GetScalarType<T[P], AggregateLead[P]>
}




export type LeadGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  where?: Prisma.LeadWhereInput
  orderBy?: Prisma.LeadOrderByWithAggregationInput | Prisma.LeadOrderByWithAggregationInput[]
  by: Prisma.LeadScalarFieldEnum[] | Prisma.LeadScalarFieldEnum
  having?: Prisma.LeadScalarWhereWithAggregatesInput
  take?: number
  skip?: number
  _count?: LeadCountAggregateInputType | true
  _min?: LeadMinAggregateInputType
  _max?: LeadMaxAggregateInputType
}

export type LeadGroupByOutputType = {
  id: string
  tenantId: string
  fullName: string
  phone: string
  sessionId: string
  pageUrl: string | null
  extra: runtime.JsonValue
  createdAt: Date
  _count: LeadCountAggregateOutputType | null
  _min: LeadMinAggregateOutputType | null
  _max: LeadMaxAggregateOutputType | null
}

export type GetLeadGroupByPayload<T extends LeadGroupByArgs> = Prisma.PrismaPromise<
  Array<
    Prisma.PickEnumerable<LeadGroupByOutputType, T['by']> &
      {
        [P in ((keyof T) & (keyof LeadGroupByOutputType))]: P extends '_count'
          ? T[P] extends boolean
            ? number
            : Prisma.GetScalarType<T[P], LeadGroupByOutputType[P]>
          : Prisma.GetScalarType<T[P], LeadGroupByOutputType[P]>
      }
    >
  >



export type LeadWhereInput = {
  AND?: Prisma.LeadWhereInput | Prisma.LeadWhereInput[]
  OR?: Prisma.LeadWhereInput[]
  NOT?: Prisma.LeadWhereInput | Prisma.LeadWhereInput[]
  id?: Prisma.StringFilter<"Lead"> | string
  tenantId?: Prisma.StringFilter<"Lead"> | string
  fullName?: Prisma.StringFilter<"Lead"> | string
  phone?: Prisma.StringFilter<"Lead"> | string
  sessionId?: Prisma.StringFilter<"Lead"> | string
  pageUrl?: Prisma.StringNullableFilter<"Lead"> | string | null
  extra?: Prisma.JsonFilter<"Lead">
  createdAt?: Prisma.DateTimeFilter<"Lead"> | Date | string
  tenant?: Prisma.XOR<Prisma.TenantScalarRelationFilter, Prisma.TenantWhereInput>
}

export type LeadOrderByWithRelationInput = {
  id?: Prisma.SortOrder
  tenantId?: Prisma.SortOrder
  fullName?: Prisma.SortOrder
  phone?: Prisma.SortOrder
  sessionId?: Prisma.SortOrder
  pageUrl?: Prisma.SortOrderInput | Prisma.SortOrder
  extra?: Prisma.SortOrder
  createdAt?: Prisma.SortOrder
  tenant?: Prisma.TenantOrderByWithRelationInput
}

export type LeadWhereUniqueInput = Prisma.AtLeast<{
  id?: string
  tenantId_sessionId?: Prisma.LeadTenantIdSessionIdCompoundUniqueInput
  AND?: Prisma.LeadWhereInput | Prisma.LeadWhereInput[]
  OR?: Prisma.LeadWhereInput[]
  NOT?: Prisma.LeadWhereInput | Prisma.LeadWhereInput[]
  tenantId?: Prisma.StringFilter<"Lead"> | string
  fullName?: Prisma.StringFilter<"Lead"> | string
  phone?: Prisma.StringFilter<"Lead"> | string
  sessionId?: Prisma.StringFilter<"Lead"> | string
  pageUrl?: Prisma.StringNullableFilter<"Lead"> | string | null
  extra?: Prisma.JsonFilter<"Lead">
  createdAt?: Prisma.DateTimeFilter<"Lead"> | Date | string
  tenant?: Prisma.XOR<Prisma.TenantScalarRelationFilter, Prisma.TenantWhereInput>
}, "id" | "tenantId_sessionId">

export type LeadOrderByWithAggregationInput = {
  id?: Prisma.SortOrder
  tenantId?: Prisma.SortOrder
  fullName?: Prisma.SortOrder
  phone?: Prisma.SortOrder
  sessionId?: Prisma.SortOrder
  pageUrl?: Prisma.SortOrderInput | Prisma.SortOrder
  extra?: Prisma.SortOrder
  createdAt?: Prisma.SortOrder
  _count?: Prisma.LeadCountOrderByAggregateInput
  _max?: Prisma.LeadMaxOrderByAggregateInput
  _min?: Prisma.LeadMinOrderByAggregateInput
}

export type LeadScalarWhereWithAggregatesInput = {
  AND?: Prisma.LeadScalarWhereWithAggregatesInput | Prisma.LeadScalarWhereWithAggregatesInput[]
  OR?: Prisma.LeadScalarWhereWithAggregatesInput[]
  NOT?: Prisma.LeadScalarWhereWithAggregatesInput | Prisma.LeadScalarWhereWithAggregatesInput[]
  id?: Prisma.StringWithAggregatesFilter<"Lead"> | string
  tenantId?: Prisma.StringWithAggregatesFilter<"Lead"> | string
  fullName?: Prisma.StringWithAggregatesFilter<"Lead"> | string
  phone?: Prisma.StringWithAggregatesFilter<"Lead"> | string
  sessionId?: Prisma.StringWithAggregatesFilter<"Lead"> | string
  pageUrl?: Prisma.StringNullableWithAggregatesFilter<"Lead"> | string | null
  extra?: Prisma.JsonWithAggregatesFilter<"Lead">
  createdAt?: Prisma.DateTimeWithAggregatesFilter<"Lead"> | Date | string
}

export type LeadCreateInput = {
  id?: string
  fullName: string
  phone: string
  sessionId: string
  pageUrl?: string | null
  extra?: Prisma.JsonNullValueInput | runtime.InputJsonValue
  createdAt?: Date | string
  tenant: Prisma.TenantCreateNestedOneWithoutLeadsInput
}

export type LeadUncheckedCreateInput = {
  id?: string
  tenantId: string
  fullName: string
  phone: string
  sessionId: string
  pageUrl?: string | null
  extra?: Prisma.JsonNullValueInput | runtime.InputJsonValue
  createdAt?: Date | string
}

export type LeadUpdateInput = {
  id?: Prisma.StringFieldUpdateOperationsInput | string
  fullName?: Prisma.StringFieldUpdateOperationsInput | string
  phone?: Prisma.StringFieldUpdateOperationsInput | string
  sessionId?: Prisma.StringFieldUpdateOperationsInput | string
  pageUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null
  extra?: Prisma.JsonNullValueInput | runtime.InputJsonValue
  createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string
  tenant?: Prisma.TenantUpdateOneRequiredWithoutLeadsNestedInput
}

export type LeadUncheckedUpdateInput = {
  id?: Prisma.StringFieldUpdateOperationsInput | string
  tenantId?: Prisma.StringFieldUpdateOperationsInput | string
  fullName?: Prisma.StringFieldUpdateOperationsInput | string
  phone?: Prisma.StringFieldUpdateOperationsInput | string
  sessionId?: Prisma.StringFieldUpdateOperationsInput | string
  pageUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null
  extra?: Prisma.JsonNullValueInput | runtime.InputJsonValue
  createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string
}

export type LeadCreateManyInput = {
  id?: string
  tenantId: string
  fullName: string
  phone: string
  sessionId: string
  pageUrl?: string | null
  extra?: Prisma.JsonNullValueInput | runtime.InputJsonValue
  createdAt?: Date | string
}

export type LeadUpdateManyMutationInput = {
  id?: Prisma.StringFieldUpdateOperationsInput | string
  fullName?: Prisma.StringFieldUpdateOperationsInput | string
  phone?: Prisma.StringFieldUpdateOperationsInput | string
  sessionId?: Prisma.StringFieldUpdateOperationsInput | string
  pageUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null
  extra?: Prisma.JsonNullValueInput | runtime.InputJsonValue
  createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string
}

export type LeadUncheckedUpdateManyInput = {
  id?: Prisma.StringFieldUpdateOperationsInput | string
  tenantId?: Prisma.StringFieldUpdateOperationsInput | string
  fullName?: Prisma.StringFieldUpdateOperationsInput | string
  phone?: Prisma.StringFieldUpdateOperationsInput | string
  sessionId?: Prisma.StringFieldUpdateOperationsInput | string
  pageUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null
  extra?: Prisma.JsonNullValueInput | runtime.InputJsonValue
  createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string
}

export type LeadListRelationFilter = {
  every?: Prisma.LeadWhereInput
  some?: Prisma.LeadWhereInput
  none?: Prisma.LeadWhereInput
}

export type LeadOrderByRelationAggregateInput = {
  _count?: Prisma.SortOrder
}

export type LeadTenantIdSessionIdCompoundUniqueInput = {
  tenantId: string
  sessionId: string
}

export type LeadCountOrderByAggregateInput = {
  id?: Prisma.SortOrder
  tenantId?: Prisma.SortOrder
  fullName?: Prisma.SortOrder
  phone?: Prisma.SortOrder
  sessionId?: Prisma.SortOrder
  pageUrl?: Prisma.SortOrder
  extra?: Prisma.SortOrder
  createdAt?: Prisma.SortOrder
}

export type LeadMaxOrderByAggregateInput = {
  id?: Prisma.SortOrder
  tenantId?: Prisma.SortOrder
  fullName?: Prisma.SortOrder
  phone?: Prisma.SortOrder
  sessionId?: Prisma.SortOrder
  pageUrl?: Prisma.SortOrder
  createdAt?: Prisma.SortOrder
}

export type LeadMinOrderByAggregateInput = {
  id?: Prisma.SortOrder
  tenantId?: Prisma.SortOrder
  fullName?: Prisma.SortOrder
  phone?: Prisma.SortOrder
  sessionId?: Prisma.SortOrder
  pageUrl?: Prisma.SortOrder
  createdAt?: Prisma.SortOrder
}

export type LeadCreateNestedManyWithoutTenantInput = {
  create?: Prisma.XOR<Prisma.LeadCreateWithoutTenantInput, Prisma.LeadUncheckedCreateWithoutTenantInput> | Prisma.LeadCreateWithoutTenantInput[] | Prisma.LeadUncheckedCreateWithoutTenantInput[]
  connectOrCreate?: Prisma.LeadCreateOrConnectWithoutTenantInput | Prisma.LeadCreateOrConnectWithoutTenantInput[]
  createMany?: Prisma.LeadCreateManyTenantInputEnvelope
  connect?: Prisma.LeadWhereUniqueInput | Prisma.LeadWhereUniqueInput[]
}

export type LeadUncheckedCreateNestedManyWithoutTenantInput = {
  create?: Prisma.XOR<Prisma.LeadCreateWithoutTenantInput, Prisma.LeadUncheckedCreateWithoutTenantInput> | Prisma.LeadCreateWithoutTenantInput[] | Prisma.LeadUncheckedCreateWithoutTenantInput[]
  connectOrCreate?: Prisma.LeadCreateOrConnectWithoutTenantInput | Prisma.LeadCreateOrConnectWithoutTenantInput[]
  createMany?: Prisma.LeadCreateManyTenantInputEnvelope
  connect?: Prisma.LeadWhereUniqueInput | Prisma.LeadWhereUniqueInput[]
}

export type LeadUpdateManyWithoutTenantNestedInput = {
  create?: Prisma.XOR<Prisma.LeadCreateWithoutTenantInput, Prisma.LeadUncheckedCreateWithoutTenantInput> | Prisma.LeadCreateWithoutTenantInput[] | Prisma.LeadUncheckedCreateWithoutTenantInput[]
  connectOrCreate?: Prisma.LeadCreateOrConnectWithoutTenantInput | Prisma.LeadCreateOrConnectWithoutTenantInput[]
  upsert?: Prisma.LeadUpsertWithWhereUniqueWithoutTenantInput | Prisma.LeadUpsertWithWhereUniqueWithoutTenantInput[]
  createMany?: Prisma.LeadCreateManyTenantInputEnvelope
  set?: Prisma.LeadWhereUniqueInput | Prisma.LeadWhereUniqueInput[]
  disconnect?: Prisma.LeadWhereUniqueInput | Prisma.LeadWhereUniqueInput[]
  delete?: Prisma.LeadWhereUniqueInput | Prisma.LeadWhereUniqueInput[]
  connect?: Prisma.LeadWhereUniqueInput | Prisma.LeadWhereUniqueInput[]
  update?: Prisma.LeadUpdateWithWhereUniqueWithoutTenantInput | Prisma.LeadUpdateWithWhereUniqueWithoutTenantInput[]
  updateMany?: Prisma.LeadUpdateManyWithWhereWithoutTenantInput | Prisma.LeadUpdateManyWithWhereWithoutTenantInput[]
  deleteMany?: Prisma.LeadScalarWhereInput | Prisma.LeadScalarWhereInput[]
}

export type LeadUncheckedUpdateManyWithoutTenantNestedInput = {
  create?: Prisma.XOR<Prisma.LeadCreateWithoutTenantInput, Prisma.LeadUncheckedCreateWithoutTenantInput> | Prisma.LeadCreateWithoutTenantInput[] | Prisma.LeadUncheckedCreateWithoutTenantInput[]
  connectOrCreate?: Prisma.LeadCreateOrConnectWithoutTenantInput | Prisma.LeadCreateOrConnectWithoutTenantInput[]
  upsert?: Prisma.LeadUpsertWithWhereUniqueWithoutTenantInput | Prisma.LeadUpsertWithWhereUniqueWithoutTenantInput[]
  createMany?: Prisma.LeadCreateManyTenantInputEnvelope
  set?: Prisma.LeadWhereUniqueInput | Prisma.LeadWhereUniqueInput[]
  disconnect?: Prisma.LeadWhereUniqueInput | Prisma.LeadWhereUniqueInput[]
  delete?: Prisma.LeadWhereUniqueInput | Prisma.LeadWhereUniqueInput[]
  connect?: Prisma.LeadWhereUniqueInput | Prisma.LeadWhereUniqueInput[]
  update?: Prisma.LeadUpdateWithWhereUniqueWithoutTenantInput | Prisma.LeadUpdateWithWhereUniqueWithoutTenantInput[]
  updateMany?: Prisma.LeadUpdateManyWithWhereWithoutTenantInput | Prisma.LeadUpdateManyWithWhereWithoutTenantInput[]
  deleteMany?: Prisma.LeadScalarWhereInput | Prisma.LeadScalarWhereInput[]
}

export type LeadCreateWithoutTenantInput = {
  id?: string
  fullName: string
  phone: string
  sessionId: string
  pageUrl?: string | null
  extra?: Prisma.JsonNullValueInput | runtime.InputJsonValue
  createdAt?: Date | string
}

export type LeadUncheckedCreateWithoutTenantInput = {
  id?: string
  fullName: string
  phone: string
  sessionId: string
  pageUrl?: string | null
  extra?: Prisma.JsonNullValueInput | runtime.InputJsonValue
  createdAt?: Date | string
}

export type LeadCreateOrConnectWithoutTenantInput = {
  where: Prisma.LeadWhereUniqueInput
  create: Prisma.XOR<Prisma.LeadCreateWithoutTenantInput, Prisma.LeadUncheckedCreateWithoutTenantInput>
}

export type LeadCreateManyTenantInputEnvelope = {
  data: Prisma.LeadCreateManyTenantInput | Prisma.LeadCreateManyTenantInput[]
  skipDuplicates?: boolean
}

export type LeadUpsertWithWhereUniqueWithoutTenantInput = {
  where: Prisma.LeadWhereUniqueInput
  update: Prisma.XOR<Prisma.LeadUpdateWithoutTenantInput, Prisma.LeadUncheckedUpdateWithoutTenantInput>
  create: Prisma.XOR<Prisma.LeadCreateWithoutTenantInput, Prisma.LeadUncheckedCreateWithoutTenantInput>
}

export type LeadUpdateWithWhereUniqueWithoutTenantInput = {
  where: Prisma.LeadWhereUniqueInput
  data: Prisma.XOR<Prisma.LeadUpdateWithoutTenantInput, Prisma.LeadUncheckedUpdateWithoutTenantInput>
}

export type LeadUpdateManyWithWhereWithoutTenantInput = {
  where: Prisma.LeadScalarWhereInput
  data: Prisma.XOR<Prisma.LeadUpdateManyMutationInput, Prisma.LeadUncheckedUpdateManyWithoutTenantInput>
}

export type LeadScalarWhereInput = {
  AND?: Prisma.LeadScalarWhereInput | Prisma.LeadScalarWhereInput[]
  OR?: Prisma.LeadScalarWhereInput[]
  NOT?: Prisma.LeadScalarWhereInput | Prisma.LeadScalarWhereInput[]
  id?: Prisma.StringFilter<"Lead"> | string
  tenantId?: Prisma.StringFilter<"Lead"> | string
  fullName?: Prisma.StringFilter<"Lead"> | string
  phone?: Prisma.StringFilter<"Lead"> | string
  sessionId?: Prisma.StringFilter<"Lead"> | string
  pageUrl?: Prisma.StringNullableFilter<"Lead"> | string | null
  extra?: Prisma.JsonFilter<"Lead">
  createdAt?: Prisma.DateTimeFilter<"Lead"> | Date | string
}

export type LeadCreateManyTenantInput = {
  id?: string
  fullName: string
  phone: string
  sessionId: string
  pageUrl?: string | null
  extra?: Prisma.JsonNullValueInput | runtime.InputJsonValue
  createdAt?: Date | string
}

export type LeadUpdateWithoutTenantInput = {
  id?: Prisma.StringFieldUpdateOperationsInput | string
  fullName?: Prisma.StringFieldUpdateOperationsInput | string
  phone?: Prisma.StringFieldUpdateOperationsInput | string
  sessionId?: Prisma.StringFieldUpdateOperationsInput | string
  pageUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null
  extra?: Prisma.JsonNullValueInput | runtime.InputJsonValue
  createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string
}

export type LeadUncheckedUpdateWithoutTenantInput = {
  id?: Prisma.StringFieldUpdateOperationsInput | string
  fullName?: Prisma.StringFieldUpdateOperationsInput | string
  phone?: Prisma.StringFieldUpdateOperationsInput | string
  sessionId?: Prisma.StringFieldUpdateOperationsInput | string
  pageUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null
  extra?: Prisma.JsonNullValueInput | runtime.InputJsonValue
  createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string
}

export type LeadUncheckedUpdateManyWithoutTenantInput = {
  id?: Prisma.StringFieldUpdateOperationsInput | string
  fullName?: Prisma.StringFieldUpdateOperationsInput | string
  phone?: Prisma.StringFieldUpdateOperationsInput | string
  sessionId?: Prisma.StringFieldUpdateOperationsInput | string
  pageUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null
  extra?: Prisma.JsonNullValueInput | runtime.InputJsonValue
  createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string
}



export type LeadSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
  id?: boolean
  tenantId?: boolean
  fullName?: boolean
  phone?: boolean
  sessionId?: boolean
  pageUrl?: boolean
  extra?: boolean
  createdAt?: boolean
  tenant?: boolean | Prisma.TenantDefaultArgs<ExtArgs>
}, ExtArgs["result"]["lead"]>

export type LeadSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
  id?: boolean
  tenantId?: boolean
  fullName?: boolean
  phone?: boolean
  sessionId?: boolean
  pageUrl?: boolean
  extra?: boolean
  createdAt?: boolean
  tenant?: boolean | Prisma.TenantDefaultArgs<ExtArgs>
}, ExtArgs["result"]["lead"]>

export type LeadSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
  id?: boolean
  tenantId?: boolean
  fullName?: boolean
  phone?: boolean
  sessionId?: boolean
  pageUrl?: boolean
  extra?: boolean
  createdAt?: boolean
  tenant?: boolean | Prisma.TenantDefaultArgs<ExtArgs>
}, ExtArgs["result"]["lead"]>

export type LeadSelectScalar = {
  id?: boolean
  tenantId?: boolean
  fullName?: boolean
  phone?: boolean
  sessionId?: boolean
  pageUrl?: boolean
  extra?: boolean
  createdAt?: boolean
}

export type LeadOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "tenantId" | "fullName" | "phone" | "sessionId" | "pageUrl" | "extra" | "createdAt", ExtArgs["result"]["lead"]>
export type LeadInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  tenant?: boolean | Prisma.TenantDefaultArgs<ExtArgs>
}
export type LeadIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  tenant?: boolean | Prisma.TenantDefaultArgs<ExtArgs>
}
export type LeadIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  tenant?: boolean | Prisma.TenantDefaultArgs<ExtArgs>
}

export type $LeadPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  name: "Lead"
  objects: {
    tenant: Prisma.$TenantPayload<ExtArgs>
  }
  scalars: runtime.Types.Extensions.GetPayloadResult<{
    id: string
    tenantId: string
    fullName: string
    phone: string
    sessionId: string
    pageUrl: string | null
    extra: runtime.JsonValue
    createdAt: Date
  }, ExtArgs["result"]["lead"]>
  composites: {}
}

export type LeadGetPayload<S extends boolean | null | undefined | LeadDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$LeadPayload, S>

export type LeadCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> =
  Omit<LeadFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: LeadCountAggregateInputType | true
  }

export interface LeadDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Lead'], meta: { name: 'Lead' } }
  findUnique<T extends LeadFindUniqueArgs>(args: Prisma.SelectSubset<T, LeadFindUniqueArgs<ExtArgs>>): Prisma.Prisma__LeadClient<runtime.Types.Result.GetResult<Prisma.$LeadPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
  findUniqueOrThrow<T extends LeadFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, LeadFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__LeadClient<runtime.Types.Result.GetResult<Prisma.$LeadPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

  findFirst<T extends LeadFindFirstArgs>(args?: Prisma.SelectSubset<T, LeadFindFirstArgs<ExtArgs>>): Prisma.Prisma__LeadClient<runtime.Types.Result.GetResult<Prisma.$LeadPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
  findFirstOrThrow<T extends LeadFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, LeadFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__LeadClient<runtime.Types.Result.GetResult<Prisma.$LeadPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>
  findMany<T extends LeadFindManyArgs>(args?: Prisma.SelectSubset<T, LeadFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$LeadPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>
  create<T extends LeadCreateArgs>(args: Prisma.SelectSubset<T, LeadCreateArgs<ExtArgs>>): Prisma.Prisma__LeadClient<runtime.Types.Result.GetResult<Prisma.$LeadPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>
  createMany<T extends LeadCreateManyArgs>(args?: Prisma.SelectSubset<T, LeadCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>
  createManyAndReturn<T extends LeadCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, LeadCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$LeadPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>
  delete<T extends LeadDeleteArgs>(args: Prisma.SelectSubset<T, LeadDeleteArgs<ExtArgs>>): Prisma.Prisma__LeadClient<runtime.Types.Result.GetResult<Prisma.$LeadPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>
  update<T extends LeadUpdateArgs>(args: Prisma.SelectSubset<T, LeadUpdateArgs<ExtArgs>>): Prisma.Prisma__LeadClient<runtime.Types.Result.GetResult<Prisma.$LeadPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>
  deleteMany<T extends LeadDeleteManyArgs>(args?: Prisma.SelectSubset<T, LeadDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>
  updateMany<T extends LeadUpdateManyArgs>(args: Prisma.SelectSubset<T, LeadUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>
  updateManyAndReturn<T extends LeadUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, LeadUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$LeadPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>
  upsert<T extends LeadUpsertArgs>(args: Prisma.SelectSubset<T, LeadUpsertArgs<ExtArgs>>): Prisma.Prisma__LeadClient<runtime.Types.Result.GetResult<Prisma.$LeadPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>
  count<T extends LeadCountArgs>(
    args?: Prisma.Subset<T, LeadCountArgs>,
  ): Prisma.PrismaPromise<
    T extends runtime.Types.Utils.Record<'select', any>
      ? T['select'] extends true
        ? number
        : Prisma.GetScalarType<T['select'], LeadCountAggregateOutputType>
      : number
  >
  aggregate<T extends LeadAggregateArgs>(args: Prisma.Subset<T, LeadAggregateArgs>): Prisma.PrismaPromise<GetLeadAggregateType<T>>
  groupBy<
    T extends LeadGroupByArgs,
    HasSelectOrTake extends Prisma.Or<
      Prisma.Extends<'skip', Prisma.Keys<T>>,
      Prisma.Extends<'take', Prisma.Keys<T>>
    >,
    OrderByArg extends Prisma.True extends HasSelectOrTake
      ? { orderBy: LeadGroupByArgs['orderBy'] }
      : { orderBy?: LeadGroupByArgs['orderBy'] },
    OrderFields extends Prisma.ExcludeUnderscoreKeys<Prisma.Keys<Prisma.MaybeTupleToUnion<T['orderBy']>>>,
    ByFields extends Prisma.MaybeTupleToUnion<T['by']>,
    ByValid extends Prisma.Has<ByFields, OrderFields>,
    HavingFields extends Prisma.GetHavingFields<T['having']>,
    HavingValid extends Prisma.Has<ByFields, HavingFields>,
    ByEmpty extends T['by'] extends never[] ? Prisma.True : Prisma.False,
    InputErrors extends ByEmpty extends Prisma.True
    ? `Error: "by" must not be empty.`
    : HavingValid extends Prisma.False
    ? {
        [P in HavingFields]: P extends ByFields
          ? never
          : P extends string
          ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
          : [
              Error,
              'Field ',
              P,
              ` in "having" needs to be provided in "by"`,
            ]
      }[HavingFields]
    : 'take' extends Prisma.Keys<T>
    ? 'orderBy' extends Prisma.Keys<T>
      ? ByValid extends Prisma.True
        ? {}
        : {
            [P in OrderFields]: P extends ByFields
              ? never
              : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
          }[OrderFields]
      : 'Error: If you provide "take", you also need to provide "orderBy"'
    : 'skip' extends Prisma.Keys<T>
    ? 'orderBy' extends Prisma.Keys<T>
      ? ByValid extends Prisma.True
        ? {}
        : {
            [P in OrderFields]: P extends ByFields
              ? never
              : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
          }[OrderFields]
      : 'Error: If you provide "skip", you also need to provide "orderBy"'
    : ByValid extends Prisma.True
    ? {}
    : {
        [P in OrderFields]: P extends ByFields
          ? never
          : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
      }[OrderFields]
  >(args: Prisma.SubsetIntersection<T, LeadGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLeadGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>

readonly fields: LeadFieldRefs;
}


export interface Prisma__LeadClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
  readonly [Symbol.toStringTag]: "PrismaPromise"
  tenant<T extends Prisma.TenantDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.TenantDefaultArgs<ExtArgs>>): Prisma.Prisma__TenantClient<runtime.Types.Result.GetResult<Prisma.$TenantPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
  then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>
  catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>
  finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>
}


export interface LeadFieldRefs {
  readonly id: Prisma.FieldRef<"Lead", 'String'>
  readonly tenantId: Prisma.FieldRef<"Lead", 'String'>
  readonly fullName: Prisma.FieldRef<"Lead", 'String'>
  readonly phone: Prisma.FieldRef<"Lead", 'String'>
  readonly sessionId: Prisma.FieldRef<"Lead", 'String'>
  readonly pageUrl: Prisma.FieldRef<"Lead", 'String'>
  readonly extra: Prisma.FieldRef<"Lead", 'Json'>
  readonly createdAt: Prisma.FieldRef<"Lead", 'DateTime'>
}
    


export type LeadFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  select?: Prisma.LeadSelect<ExtArgs> | null
  omit?: Prisma.LeadOmit<ExtArgs> | null
  include?: Prisma.LeadInclude<ExtArgs> | null
  where: Prisma.LeadWhereUniqueInput
}

export type LeadFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  select?: Prisma.LeadSelect<ExtArgs> | null
  omit?: Prisma.LeadOmit<ExtArgs> | null
  include?: Prisma.LeadInclude<ExtArgs> | null
  where: Prisma.LeadWhereUniqueInput
}

export type LeadFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  select?: Prisma.LeadSelect<ExtArgs> | null
  omit?: Prisma.LeadOmit<ExtArgs> | null
  include?: Prisma.LeadInclude<ExtArgs> | null
  where?: Prisma.LeadWhereInput
  orderBy?: Prisma.LeadOrderByWithRelationInput | Prisma.LeadOrderByWithRelationInput[]
  cursor?: Prisma.LeadWhereUniqueInput
  take?: number
  skip?: number
  distinct?: Prisma.LeadScalarFieldEnum | Prisma.LeadScalarFieldEnum[]
}


export type LeadFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  select?: Prisma.LeadSelect<ExtArgs> | null
  omit?: Prisma.LeadOmit<ExtArgs> | null
  include?: Prisma.LeadInclude<ExtArgs> | null
  where?: Prisma.LeadWhereInput
  orderBy?: Prisma.LeadOrderByWithRelationInput | Prisma.LeadOrderByWithRelationInput[]
  cursor?: Prisma.LeadWhereUniqueInput
  take?: number
  skip?: number
  distinct?: Prisma.LeadScalarFieldEnum | Prisma.LeadScalarFieldEnum[]
}


export type LeadFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {

  select?: Prisma.LeadSelect<ExtArgs> | null
  omit?: Prisma.LeadOmit<ExtArgs> | null
  include?: Prisma.LeadInclude<ExtArgs> | null
  where?: Prisma.LeadWhereInput
  orderBy?: Prisma.LeadOrderByWithRelationInput | Prisma.LeadOrderByWithRelationInput[]
  cursor?: Prisma.LeadWhereUniqueInput
  take?: number
  skip?: number
  distinct?: Prisma.LeadScalarFieldEnum | Prisma.LeadScalarFieldEnum[]
}

export type LeadCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  select?: Prisma.LeadSelect<ExtArgs> | null
  omit?: Prisma.LeadOmit<ExtArgs> | null
  include?: Prisma.LeadInclude<ExtArgs> | null
  data: Prisma.XOR<Prisma.LeadCreateInput, Prisma.LeadUncheckedCreateInput>
}

export type LeadCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  data: Prisma.LeadCreateManyInput | Prisma.LeadCreateManyInput[]
  skipDuplicates?: boolean
}

export type LeadCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  select?: Prisma.LeadSelectCreateManyAndReturn<ExtArgs> | null
  omit?: Prisma.LeadOmit<ExtArgs> | null
  data: Prisma.LeadCreateManyInput | Prisma.LeadCreateManyInput[]
  skipDuplicates?: boolean
  include?: Prisma.LeadIncludeCreateManyAndReturn<ExtArgs> | null
}


export type LeadUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  select?: Prisma.LeadSelect<ExtArgs> | null
  omit?: Prisma.LeadOmit<ExtArgs> | null
  include?: Prisma.LeadInclude<ExtArgs> | null
  data: Prisma.XOR<Prisma.LeadUpdateInput, Prisma.LeadUncheckedUpdateInput>
  where: Prisma.LeadWhereUniqueInput
}


export type LeadUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  data: Prisma.XOR<Prisma.LeadUpdateManyMutationInput, Prisma.LeadUncheckedUpdateManyInput>
  where?: Prisma.LeadWhereInput
  limit?: number
}

export type LeadUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  select?: Prisma.LeadSelectUpdateManyAndReturn<ExtArgs> | null
  omit?: Prisma.LeadOmit<ExtArgs> | null
  data: Prisma.XOR<Prisma.LeadUpdateManyMutationInput, Prisma.LeadUncheckedUpdateManyInput>
  where?: Prisma.LeadWhereInput
  limit?: number
  include?: Prisma.LeadIncludeUpdateManyAndReturn<ExtArgs> | null
}


export type LeadUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  select?: Prisma.LeadSelect<ExtArgs> | null
  omit?: Prisma.LeadOmit<ExtArgs> | null
  include?: Prisma.LeadInclude<ExtArgs> | null
  where: Prisma.LeadWhereUniqueInput
  create: Prisma.XOR<Prisma.LeadCreateInput, Prisma.LeadUncheckedCreateInput>
  update: Prisma.XOR<Prisma.LeadUpdateInput, Prisma.LeadUncheckedUpdateInput>
}

export type LeadDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  select?: Prisma.LeadSelect<ExtArgs> | null
  omit?: Prisma.LeadOmit<ExtArgs> | null
  include?: Prisma.LeadInclude<ExtArgs> | null

  where: Prisma.LeadWhereUniqueInput
}

export type LeadDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  where?: Prisma.LeadWhereInput
  limit?: number
}

export type LeadDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  select?: Prisma.LeadSelect<ExtArgs> | null
  omit?: Prisma.LeadOmit<ExtArgs> | null
  include?: Prisma.LeadInclude<ExtArgs> | null
}
