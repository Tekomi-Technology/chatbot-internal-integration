import type * as runtime from "@prisma/client/runtime/client"
import type * as $Enums from "../enums"
import type * as Prisma from "../internal/prismaNamespace"

export type WidgetMessageModel = runtime.Types.Result.DefaultSelection<Prisma.$WidgetMessagePayload>

export type AggregateWidgetMessage = {
  _count: WidgetMessageCountAggregateOutputType | null
  _min: WidgetMessageMinAggregateOutputType | null
  _max: WidgetMessageMaxAggregateOutputType | null
}

export type WidgetMessageMinAggregateOutputType = {
  id: string | null
  conversationId: string | null
  sender: $Enums.WidgetMessageSender | null
  text: string | null
  createdAt: Date | null
}

export type WidgetMessageMaxAggregateOutputType = {
  id: string | null
  conversationId: string | null
  sender: $Enums.WidgetMessageSender | null
  text: string | null
  createdAt: Date | null
}

export type WidgetMessageCountAggregateOutputType = {
  id: number
  conversationId: number
  sender: number
  text: number
  createdAt: number
  _all: number
}


export type WidgetMessageMinAggregateInputType = {
  id?: true
  conversationId?: true
  sender?: true
  text?: true
  createdAt?: true
}

export type WidgetMessageMaxAggregateInputType = {
  id?: true
  conversationId?: true
  sender?: true
  text?: true
  createdAt?: true
}

export type WidgetMessageCountAggregateInputType = {
  id?: true
  conversationId?: true
  sender?: true
  text?: true
  createdAt?: true
  _all?: true
}

export type WidgetMessageAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {

  where?: Prisma.WidgetMessageWhereInput
  /**
   * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
   * 
   * Determine the order of WidgetMessages to fetch.
   */
  orderBy?: Prisma.WidgetMessageOrderByWithRelationInput | Prisma.WidgetMessageOrderByWithRelationInput[]
  /**
   * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
   * 
   * Sets the start position
   */
  cursor?: Prisma.WidgetMessageWhereUniqueInput
  /**
   * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
   * 
   * Take `±n` WidgetMessages from the position of the cursor.
   */
  take?: number
  /**
   * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
   * 
   * Skip the first `n` WidgetMessages.
   */
  skip?: number
  /**
   * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
   * 
   * Count returned WidgetMessages
  **/
  _count?: true | WidgetMessageCountAggregateInputType
  /**
   * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
   * 
   * Select which fields to find the minimum value
  **/
  _min?: WidgetMessageMinAggregateInputType
  /**
   * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
   * 
   * Select which fields to find the maximum value
  **/
  _max?: WidgetMessageMaxAggregateInputType
}

export type GetWidgetMessageAggregateType<T extends WidgetMessageAggregateArgs> = {
      [P in keyof T & keyof AggregateWidgetMessage]: P extends '_count' | 'count'
    ? T[P] extends true
      ? number
      : Prisma.GetScalarType<T[P], AggregateWidgetMessage[P]>
    : Prisma.GetScalarType<T[P], AggregateWidgetMessage[P]>
}




export type WidgetMessageGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  where?: Prisma.WidgetMessageWhereInput
  orderBy?: Prisma.WidgetMessageOrderByWithAggregationInput | Prisma.WidgetMessageOrderByWithAggregationInput[]
  by: Prisma.WidgetMessageScalarFieldEnum[] | Prisma.WidgetMessageScalarFieldEnum
  having?: Prisma.WidgetMessageScalarWhereWithAggregatesInput
  take?: number
  skip?: number
  _count?: WidgetMessageCountAggregateInputType | true
  _min?: WidgetMessageMinAggregateInputType
  _max?: WidgetMessageMaxAggregateInputType
}

export type WidgetMessageGroupByOutputType = {
  id: string
  conversationId: string
  sender: $Enums.WidgetMessageSender
  text: string
  createdAt: Date
  _count: WidgetMessageCountAggregateOutputType | null
  _min: WidgetMessageMinAggregateOutputType | null
  _max: WidgetMessageMaxAggregateOutputType | null
}

export type GetWidgetMessageGroupByPayload<T extends WidgetMessageGroupByArgs> = Prisma.PrismaPromise<
  Array<
    Prisma.PickEnumerable<WidgetMessageGroupByOutputType, T['by']> &
      {
        [P in ((keyof T) & (keyof WidgetMessageGroupByOutputType))]: P extends '_count'
          ? T[P] extends boolean
            ? number
            : Prisma.GetScalarType<T[P], WidgetMessageGroupByOutputType[P]>
          : Prisma.GetScalarType<T[P], WidgetMessageGroupByOutputType[P]>
      }
    >
  >



export type WidgetMessageWhereInput = {
  AND?: Prisma.WidgetMessageWhereInput | Prisma.WidgetMessageWhereInput[]
  OR?: Prisma.WidgetMessageWhereInput[]
  NOT?: Prisma.WidgetMessageWhereInput | Prisma.WidgetMessageWhereInput[]
  id?: Prisma.StringFilter<"WidgetMessage"> | string
  conversationId?: Prisma.StringFilter<"WidgetMessage"> | string
  sender?: Prisma.EnumWidgetMessageSenderFilter<"WidgetMessage"> | $Enums.WidgetMessageSender
  text?: Prisma.StringFilter<"WidgetMessage"> | string
  createdAt?: Prisma.DateTimeFilter<"WidgetMessage"> | Date | string
  conversation?: Prisma.XOR<Prisma.WidgetConversationScalarRelationFilter, Prisma.WidgetConversationWhereInput>
}

export type WidgetMessageOrderByWithRelationInput = {
  id?: Prisma.SortOrder
  conversationId?: Prisma.SortOrder
  sender?: Prisma.SortOrder
  text?: Prisma.SortOrder
  createdAt?: Prisma.SortOrder
  conversation?: Prisma.WidgetConversationOrderByWithRelationInput
}

export type WidgetMessageWhereUniqueInput = Prisma.AtLeast<{
  id?: string
  AND?: Prisma.WidgetMessageWhereInput | Prisma.WidgetMessageWhereInput[]
  OR?: Prisma.WidgetMessageWhereInput[]
  NOT?: Prisma.WidgetMessageWhereInput | Prisma.WidgetMessageWhereInput[]
  conversationId?: Prisma.StringFilter<"WidgetMessage"> | string
  sender?: Prisma.EnumWidgetMessageSenderFilter<"WidgetMessage"> | $Enums.WidgetMessageSender
  text?: Prisma.StringFilter<"WidgetMessage"> | string
  createdAt?: Prisma.DateTimeFilter<"WidgetMessage"> | Date | string
  conversation?: Prisma.XOR<Prisma.WidgetConversationScalarRelationFilter, Prisma.WidgetConversationWhereInput>
}, "id">

export type WidgetMessageOrderByWithAggregationInput = {
  id?: Prisma.SortOrder
  conversationId?: Prisma.SortOrder
  sender?: Prisma.SortOrder
  text?: Prisma.SortOrder
  createdAt?: Prisma.SortOrder
  _count?: Prisma.WidgetMessageCountOrderByAggregateInput
  _max?: Prisma.WidgetMessageMaxOrderByAggregateInput
  _min?: Prisma.WidgetMessageMinOrderByAggregateInput
}

export type WidgetMessageScalarWhereWithAggregatesInput = {
  AND?: Prisma.WidgetMessageScalarWhereWithAggregatesInput | Prisma.WidgetMessageScalarWhereWithAggregatesInput[]
  OR?: Prisma.WidgetMessageScalarWhereWithAggregatesInput[]
  NOT?: Prisma.WidgetMessageScalarWhereWithAggregatesInput | Prisma.WidgetMessageScalarWhereWithAggregatesInput[]
  id?: Prisma.StringWithAggregatesFilter<"WidgetMessage"> | string
  conversationId?: Prisma.StringWithAggregatesFilter<"WidgetMessage"> | string
  sender?: Prisma.EnumWidgetMessageSenderWithAggregatesFilter<"WidgetMessage"> | $Enums.WidgetMessageSender
  text?: Prisma.StringWithAggregatesFilter<"WidgetMessage"> | string
  createdAt?: Prisma.DateTimeWithAggregatesFilter<"WidgetMessage"> | Date | string
}

export type WidgetMessageCreateInput = {
  id?: string
  sender: $Enums.WidgetMessageSender
  text: string
  createdAt?: Date | string
  conversation: Prisma.WidgetConversationCreateNestedOneWithoutMessagesInput
}

export type WidgetMessageUncheckedCreateInput = {
  id?: string
  conversationId: string
  sender: $Enums.WidgetMessageSender
  text: string
  createdAt?: Date | string
}

export type WidgetMessageUpdateInput = {
  id?: Prisma.StringFieldUpdateOperationsInput | string
  sender?: Prisma.EnumWidgetMessageSenderFieldUpdateOperationsInput | $Enums.WidgetMessageSender
  text?: Prisma.StringFieldUpdateOperationsInput | string
  createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string
  conversation?: Prisma.WidgetConversationUpdateOneRequiredWithoutMessagesNestedInput
}

export type WidgetMessageUncheckedUpdateInput = {
  id?: Prisma.StringFieldUpdateOperationsInput | string
  conversationId?: Prisma.StringFieldUpdateOperationsInput | string
  sender?: Prisma.EnumWidgetMessageSenderFieldUpdateOperationsInput | $Enums.WidgetMessageSender
  text?: Prisma.StringFieldUpdateOperationsInput | string
  createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string
}

export type WidgetMessageCreateManyInput = {
  id?: string
  conversationId: string
  sender: $Enums.WidgetMessageSender
  text: string
  createdAt?: Date | string
}

export type WidgetMessageUpdateManyMutationInput = {
  id?: Prisma.StringFieldUpdateOperationsInput | string
  sender?: Prisma.EnumWidgetMessageSenderFieldUpdateOperationsInput | $Enums.WidgetMessageSender
  text?: Prisma.StringFieldUpdateOperationsInput | string
  createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string
}

export type WidgetMessageUncheckedUpdateManyInput = {
  id?: Prisma.StringFieldUpdateOperationsInput | string
  conversationId?: Prisma.StringFieldUpdateOperationsInput | string
  sender?: Prisma.EnumWidgetMessageSenderFieldUpdateOperationsInput | $Enums.WidgetMessageSender
  text?: Prisma.StringFieldUpdateOperationsInput | string
  createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string
}

export type WidgetMessageListRelationFilter = {
  every?: Prisma.WidgetMessageWhereInput
  some?: Prisma.WidgetMessageWhereInput
  none?: Prisma.WidgetMessageWhereInput
}

export type WidgetMessageOrderByRelationAggregateInput = {
  _count?: Prisma.SortOrder
}

export type WidgetMessageCountOrderByAggregateInput = {
  id?: Prisma.SortOrder
  conversationId?: Prisma.SortOrder
  sender?: Prisma.SortOrder
  text?: Prisma.SortOrder
  createdAt?: Prisma.SortOrder
}

export type WidgetMessageMaxOrderByAggregateInput = {
  id?: Prisma.SortOrder
  conversationId?: Prisma.SortOrder
  sender?: Prisma.SortOrder
  text?: Prisma.SortOrder
  createdAt?: Prisma.SortOrder
}

export type WidgetMessageMinOrderByAggregateInput = {
  id?: Prisma.SortOrder
  conversationId?: Prisma.SortOrder
  sender?: Prisma.SortOrder
  text?: Prisma.SortOrder
  createdAt?: Prisma.SortOrder
}

export type WidgetMessageCreateNestedManyWithoutConversationInput = {
  create?: Prisma.XOR<Prisma.WidgetMessageCreateWithoutConversationInput, Prisma.WidgetMessageUncheckedCreateWithoutConversationInput> | Prisma.WidgetMessageCreateWithoutConversationInput[] | Prisma.WidgetMessageUncheckedCreateWithoutConversationInput[]
  connectOrCreate?: Prisma.WidgetMessageCreateOrConnectWithoutConversationInput | Prisma.WidgetMessageCreateOrConnectWithoutConversationInput[]
  createMany?: Prisma.WidgetMessageCreateManyConversationInputEnvelope
  connect?: Prisma.WidgetMessageWhereUniqueInput | Prisma.WidgetMessageWhereUniqueInput[]
}

export type WidgetMessageUncheckedCreateNestedManyWithoutConversationInput = {
  create?: Prisma.XOR<Prisma.WidgetMessageCreateWithoutConversationInput, Prisma.WidgetMessageUncheckedCreateWithoutConversationInput> | Prisma.WidgetMessageCreateWithoutConversationInput[] | Prisma.WidgetMessageUncheckedCreateWithoutConversationInput[]
  connectOrCreate?: Prisma.WidgetMessageCreateOrConnectWithoutConversationInput | Prisma.WidgetMessageCreateOrConnectWithoutConversationInput[]
  createMany?: Prisma.WidgetMessageCreateManyConversationInputEnvelope
  connect?: Prisma.WidgetMessageWhereUniqueInput | Prisma.WidgetMessageWhereUniqueInput[]
}

export type WidgetMessageUpdateManyWithoutConversationNestedInput = {
  create?: Prisma.XOR<Prisma.WidgetMessageCreateWithoutConversationInput, Prisma.WidgetMessageUncheckedCreateWithoutConversationInput> | Prisma.WidgetMessageCreateWithoutConversationInput[] | Prisma.WidgetMessageUncheckedCreateWithoutConversationInput[]
  connectOrCreate?: Prisma.WidgetMessageCreateOrConnectWithoutConversationInput | Prisma.WidgetMessageCreateOrConnectWithoutConversationInput[]
  upsert?: Prisma.WidgetMessageUpsertWithWhereUniqueWithoutConversationInput | Prisma.WidgetMessageUpsertWithWhereUniqueWithoutConversationInput[]
  createMany?: Prisma.WidgetMessageCreateManyConversationInputEnvelope
  set?: Prisma.WidgetMessageWhereUniqueInput | Prisma.WidgetMessageWhereUniqueInput[]
  disconnect?: Prisma.WidgetMessageWhereUniqueInput | Prisma.WidgetMessageWhereUniqueInput[]
  delete?: Prisma.WidgetMessageWhereUniqueInput | Prisma.WidgetMessageWhereUniqueInput[]
  connect?: Prisma.WidgetMessageWhereUniqueInput | Prisma.WidgetMessageWhereUniqueInput[]
  update?: Prisma.WidgetMessageUpdateWithWhereUniqueWithoutConversationInput | Prisma.WidgetMessageUpdateWithWhereUniqueWithoutConversationInput[]
  updateMany?: Prisma.WidgetMessageUpdateManyWithWhereWithoutConversationInput | Prisma.WidgetMessageUpdateManyWithWhereWithoutConversationInput[]
  deleteMany?: Prisma.WidgetMessageScalarWhereInput | Prisma.WidgetMessageScalarWhereInput[]
}

export type WidgetMessageUncheckedUpdateManyWithoutConversationNestedInput = {
  create?: Prisma.XOR<Prisma.WidgetMessageCreateWithoutConversationInput, Prisma.WidgetMessageUncheckedCreateWithoutConversationInput> | Prisma.WidgetMessageCreateWithoutConversationInput[] | Prisma.WidgetMessageUncheckedCreateWithoutConversationInput[]
  connectOrCreate?: Prisma.WidgetMessageCreateOrConnectWithoutConversationInput | Prisma.WidgetMessageCreateOrConnectWithoutConversationInput[]
  upsert?: Prisma.WidgetMessageUpsertWithWhereUniqueWithoutConversationInput | Prisma.WidgetMessageUpsertWithWhereUniqueWithoutConversationInput[]
  createMany?: Prisma.WidgetMessageCreateManyConversationInputEnvelope
  set?: Prisma.WidgetMessageWhereUniqueInput | Prisma.WidgetMessageWhereUniqueInput[]
  disconnect?: Prisma.WidgetMessageWhereUniqueInput | Prisma.WidgetMessageWhereUniqueInput[]
  delete?: Prisma.WidgetMessageWhereUniqueInput | Prisma.WidgetMessageWhereUniqueInput[]
  connect?: Prisma.WidgetMessageWhereUniqueInput | Prisma.WidgetMessageWhereUniqueInput[]
  update?: Prisma.WidgetMessageUpdateWithWhereUniqueWithoutConversationInput | Prisma.WidgetMessageUpdateWithWhereUniqueWithoutConversationInput[]
  updateMany?: Prisma.WidgetMessageUpdateManyWithWhereWithoutConversationInput | Prisma.WidgetMessageUpdateManyWithWhereWithoutConversationInput[]
  deleteMany?: Prisma.WidgetMessageScalarWhereInput | Prisma.WidgetMessageScalarWhereInput[]
}

export type EnumWidgetMessageSenderFieldUpdateOperationsInput = {
  set?: $Enums.WidgetMessageSender
}

export type WidgetMessageCreateWithoutConversationInput = {
  id?: string
  sender: $Enums.WidgetMessageSender
  text: string
  createdAt?: Date | string
}

export type WidgetMessageUncheckedCreateWithoutConversationInput = {
  id?: string
  sender: $Enums.WidgetMessageSender
  text: string
  createdAt?: Date | string
}

export type WidgetMessageCreateOrConnectWithoutConversationInput = {
  where: Prisma.WidgetMessageWhereUniqueInput
  create: Prisma.XOR<Prisma.WidgetMessageCreateWithoutConversationInput, Prisma.WidgetMessageUncheckedCreateWithoutConversationInput>
}

export type WidgetMessageCreateManyConversationInputEnvelope = {
  data: Prisma.WidgetMessageCreateManyConversationInput | Prisma.WidgetMessageCreateManyConversationInput[]
  skipDuplicates?: boolean
}

export type WidgetMessageUpsertWithWhereUniqueWithoutConversationInput = {
  where: Prisma.WidgetMessageWhereUniqueInput
  update: Prisma.XOR<Prisma.WidgetMessageUpdateWithoutConversationInput, Prisma.WidgetMessageUncheckedUpdateWithoutConversationInput>
  create: Prisma.XOR<Prisma.WidgetMessageCreateWithoutConversationInput, Prisma.WidgetMessageUncheckedCreateWithoutConversationInput>
}

export type WidgetMessageUpdateWithWhereUniqueWithoutConversationInput = {
  where: Prisma.WidgetMessageWhereUniqueInput
  data: Prisma.XOR<Prisma.WidgetMessageUpdateWithoutConversationInput, Prisma.WidgetMessageUncheckedUpdateWithoutConversationInput>
}

export type WidgetMessageUpdateManyWithWhereWithoutConversationInput = {
  where: Prisma.WidgetMessageScalarWhereInput
  data: Prisma.XOR<Prisma.WidgetMessageUpdateManyMutationInput, Prisma.WidgetMessageUncheckedUpdateManyWithoutConversationInput>
}

export type WidgetMessageScalarWhereInput = {
  AND?: Prisma.WidgetMessageScalarWhereInput | Prisma.WidgetMessageScalarWhereInput[]
  OR?: Prisma.WidgetMessageScalarWhereInput[]
  NOT?: Prisma.WidgetMessageScalarWhereInput | Prisma.WidgetMessageScalarWhereInput[]
  id?: Prisma.StringFilter<"WidgetMessage"> | string
  conversationId?: Prisma.StringFilter<"WidgetMessage"> | string
  sender?: Prisma.EnumWidgetMessageSenderFilter<"WidgetMessage"> | $Enums.WidgetMessageSender
  text?: Prisma.StringFilter<"WidgetMessage"> | string
  createdAt?: Prisma.DateTimeFilter<"WidgetMessage"> | Date | string
}

export type WidgetMessageCreateManyConversationInput = {
  id?: string
  sender: $Enums.WidgetMessageSender
  text: string
  createdAt?: Date | string
}

export type WidgetMessageUpdateWithoutConversationInput = {
  id?: Prisma.StringFieldUpdateOperationsInput | string
  sender?: Prisma.EnumWidgetMessageSenderFieldUpdateOperationsInput | $Enums.WidgetMessageSender
  text?: Prisma.StringFieldUpdateOperationsInput | string
  createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string
}

export type WidgetMessageUncheckedUpdateWithoutConversationInput = {
  id?: Prisma.StringFieldUpdateOperationsInput | string
  sender?: Prisma.EnumWidgetMessageSenderFieldUpdateOperationsInput | $Enums.WidgetMessageSender
  text?: Prisma.StringFieldUpdateOperationsInput | string
  createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string
}

export type WidgetMessageUncheckedUpdateManyWithoutConversationInput = {
  id?: Prisma.StringFieldUpdateOperationsInput | string
  sender?: Prisma.EnumWidgetMessageSenderFieldUpdateOperationsInput | $Enums.WidgetMessageSender
  text?: Prisma.StringFieldUpdateOperationsInput | string
  createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string
}



export type WidgetMessageSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
  id?: boolean
  conversationId?: boolean
  sender?: boolean
  text?: boolean
  createdAt?: boolean
  conversation?: boolean | Prisma.WidgetConversationDefaultArgs<ExtArgs>
}, ExtArgs["result"]["widgetMessage"]>

export type WidgetMessageSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
  id?: boolean
  conversationId?: boolean
  sender?: boolean
  text?: boolean
  createdAt?: boolean
  conversation?: boolean | Prisma.WidgetConversationDefaultArgs<ExtArgs>
}, ExtArgs["result"]["widgetMessage"]>

export type WidgetMessageSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
  id?: boolean
  conversationId?: boolean
  sender?: boolean
  text?: boolean
  createdAt?: boolean
  conversation?: boolean | Prisma.WidgetConversationDefaultArgs<ExtArgs>
}, ExtArgs["result"]["widgetMessage"]>

export type WidgetMessageSelectScalar = {
  id?: boolean
  conversationId?: boolean
  sender?: boolean
  text?: boolean
  createdAt?: boolean
}

export type WidgetMessageOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "conversationId" | "sender" | "text" | "createdAt", ExtArgs["result"]["widgetMessage"]>
export type WidgetMessageInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  conversation?: boolean | Prisma.WidgetConversationDefaultArgs<ExtArgs>
}
export type WidgetMessageIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  conversation?: boolean | Prisma.WidgetConversationDefaultArgs<ExtArgs>
}
export type WidgetMessageIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  conversation?: boolean | Prisma.WidgetConversationDefaultArgs<ExtArgs>
}

export type $WidgetMessagePayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  name: "WidgetMessage"
  objects: {
    conversation: Prisma.$WidgetConversationPayload<ExtArgs>
  }
  scalars: runtime.Types.Extensions.GetPayloadResult<{
    id: string
    conversationId: string
    sender: $Enums.WidgetMessageSender
    text: string
    createdAt: Date
  }, ExtArgs["result"]["widgetMessage"]>
  composites: {}
}

export type WidgetMessageGetPayload<S extends boolean | null | undefined | WidgetMessageDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$WidgetMessagePayload, S>

export type WidgetMessageCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> =
  Omit<WidgetMessageFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: WidgetMessageCountAggregateInputType | true
  }

export interface WidgetMessageDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['WidgetMessage'], meta: { name: 'WidgetMessage' } }
  /**
   * Find zero or one WidgetMessage that matches the filter.
   * @param {WidgetMessageFindUniqueArgs} args - Arguments to find a WidgetMessage
   * @example
   * // Get one WidgetMessage
   * const widgetMessage = await prisma.widgetMessage.findUnique({
   *   where: {
   *     // ... provide filter here
   *   }
   * })
   */
  findUnique<T extends WidgetMessageFindUniqueArgs>(args: Prisma.SelectSubset<T, WidgetMessageFindUniqueArgs<ExtArgs>>): Prisma.Prisma__WidgetMessageClient<runtime.Types.Result.GetResult<Prisma.$WidgetMessagePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

  /**
   * Find one WidgetMessage that matches the filter or throw an error with `error.code='P2025'`
   * if no matches were found.
   * @param {WidgetMessageFindUniqueOrThrowArgs} args - Arguments to find a WidgetMessage
   * @example
   * // Get one WidgetMessage
   * const widgetMessage = await prisma.widgetMessage.findUniqueOrThrow({
   *   where: {
   *     // ... provide filter here
   *   }
   * })
   */
  findUniqueOrThrow<T extends WidgetMessageFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, WidgetMessageFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__WidgetMessageClient<runtime.Types.Result.GetResult<Prisma.$WidgetMessagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

  /**
   * Find the first WidgetMessage that matches the filter.
   * Note, that providing `undefined` is treated as the value not being there.
   * Read more here: https://pris.ly/d/null-undefined
   * @param {WidgetMessageFindFirstArgs} args - Arguments to find a WidgetMessage
   * @example
   * // Get one WidgetMessage
   * const widgetMessage = await prisma.widgetMessage.findFirst({
   *   where: {
   *     // ... provide filter here
   *   }
   * })
   */
  findFirst<T extends WidgetMessageFindFirstArgs>(args?: Prisma.SelectSubset<T, WidgetMessageFindFirstArgs<ExtArgs>>): Prisma.Prisma__WidgetMessageClient<runtime.Types.Result.GetResult<Prisma.$WidgetMessagePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

  /**
   * Find the first WidgetMessage that matches the filter or
   * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
   * Note, that providing `undefined` is treated as the value not being there.
   * Read more here: https://pris.ly/d/null-undefined
   * @param {WidgetMessageFindFirstOrThrowArgs} args - Arguments to find a WidgetMessage
   * @example
   * // Get one WidgetMessage
   * const widgetMessage = await prisma.widgetMessage.findFirstOrThrow({
   *   where: {
   *     // ... provide filter here
   *   }
   * })
   */
  findFirstOrThrow<T extends WidgetMessageFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, WidgetMessageFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__WidgetMessageClient<runtime.Types.Result.GetResult<Prisma.$WidgetMessagePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

  /**
   * Find zero or more WidgetMessages that matches the filter.
   * Note, that providing `undefined` is treated as the value not being there.
   * Read more here: https://pris.ly/d/null-undefined
   * @param {WidgetMessageFindManyArgs} args - Arguments to filter and select certain fields only.
   * @example
   * // Get all WidgetMessages
   * const widgetMessages = await prisma.widgetMessage.findMany()
   * 
   * // Get first 10 WidgetMessages
   * const widgetMessages = await prisma.widgetMessage.findMany({ take: 10 })
   * 
   * // Only select the `id`
   * const widgetMessageWithIdOnly = await prisma.widgetMessage.findMany({ select: { id: true } })
   * 
   */
  findMany<T extends WidgetMessageFindManyArgs>(args?: Prisma.SelectSubset<T, WidgetMessageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$WidgetMessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

  /**
   * Create a WidgetMessage.
   * @param {WidgetMessageCreateArgs} args - Arguments to create a WidgetMessage.
   * @example
   * // Create one WidgetMessage
   * const WidgetMessage = await prisma.widgetMessage.create({
   *   data: {
   *     // ... data to create a WidgetMessage
   *   }
   * })
   * 
   */
  create<T extends WidgetMessageCreateArgs>(args: Prisma.SelectSubset<T, WidgetMessageCreateArgs<ExtArgs>>): Prisma.Prisma__WidgetMessageClient<runtime.Types.Result.GetResult<Prisma.$WidgetMessagePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

  /**
   * Create many WidgetMessages.
   * @param {WidgetMessageCreateManyArgs} args - Arguments to create many WidgetMessages.
   * @example
   * // Create many WidgetMessages
   * const widgetMessage = await prisma.widgetMessage.createMany({
   *   data: [
   *     // ... provide data here
   *   ]
   * })
   *     
   */
  createMany<T extends WidgetMessageCreateManyArgs>(args?: Prisma.SelectSubset<T, WidgetMessageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>

  /**
   * Create many WidgetMessages and returns the data saved in the database.
   * @param {WidgetMessageCreateManyAndReturnArgs} args - Arguments to create many WidgetMessages.
   * @example
   * // Create many WidgetMessages
   * const widgetMessage = await prisma.widgetMessage.createManyAndReturn({
   *   data: [
   *     // ... provide data here
   *   ]
   * })
   * 
   * // Create many WidgetMessages and only return the `id`
   * const widgetMessageWithIdOnly = await prisma.widgetMessage.createManyAndReturn({
   *   select: { id: true },
   *   data: [
   *     // ... provide data here
   *   ]
   * })
   * Note, that providing `undefined` is treated as the value not being there.
   * Read more here: https://pris.ly/d/null-undefined
   * 
   */
  createManyAndReturn<T extends WidgetMessageCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, WidgetMessageCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$WidgetMessagePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

  /**
   * Delete a WidgetMessage.
   * @param {WidgetMessageDeleteArgs} args - Arguments to delete one WidgetMessage.
   * @example
   * // Delete one WidgetMessage
   * const WidgetMessage = await prisma.widgetMessage.delete({
   *   where: {
   *     // ... filter to delete one WidgetMessage
   *   }
   * })
   * 
   */
  delete<T extends WidgetMessageDeleteArgs>(args: Prisma.SelectSubset<T, WidgetMessageDeleteArgs<ExtArgs>>): Prisma.Prisma__WidgetMessageClient<runtime.Types.Result.GetResult<Prisma.$WidgetMessagePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

  /**
   * Update one WidgetMessage.
   * @param {WidgetMessageUpdateArgs} args - Arguments to update one WidgetMessage.
   * @example
   * // Update one WidgetMessage
   * const widgetMessage = await prisma.widgetMessage.update({
   *   where: {
   *     // ... provide filter here
   *   },
   *   data: {
   *     // ... provide data here
   *   }
   * })
   * 
   */
  update<T extends WidgetMessageUpdateArgs>(args: Prisma.SelectSubset<T, WidgetMessageUpdateArgs<ExtArgs>>): Prisma.Prisma__WidgetMessageClient<runtime.Types.Result.GetResult<Prisma.$WidgetMessagePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

  /**
   * Delete zero or more WidgetMessages.
   * @param {WidgetMessageDeleteManyArgs} args - Arguments to filter WidgetMessages to delete.
   * @example
   * // Delete a few WidgetMessages
   * const { count } = await prisma.widgetMessage.deleteMany({
   *   where: {
   *     // ... provide filter here
   *   }
   * })
   * 
   */
  deleteMany<T extends WidgetMessageDeleteManyArgs>(args?: Prisma.SelectSubset<T, WidgetMessageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>

  /**
   * Update zero or more WidgetMessages.
   * Note, that providing `undefined` is treated as the value not being there.
   * Read more here: https://pris.ly/d/null-undefined
   * @param {WidgetMessageUpdateManyArgs} args - Arguments to update one or more rows.
   * @example
   * // Update many WidgetMessages
   * const widgetMessage = await prisma.widgetMessage.updateMany({
   *   where: {
   *     // ... provide filter here
   *   },
   *   data: {
   *     // ... provide data here
   *   }
   * })
   * 
   */
  updateMany<T extends WidgetMessageUpdateManyArgs>(args: Prisma.SelectSubset<T, WidgetMessageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>

  /**
   * Update zero or more WidgetMessages and returns the data updated in the database.
   * @param {WidgetMessageUpdateManyAndReturnArgs} args - Arguments to update many WidgetMessages.
   * @example
   * // Update many WidgetMessages
   * const widgetMessage = await prisma.widgetMessage.updateManyAndReturn({
   *   where: {
   *     // ... provide filter here
   *   },
   *   data: [
   *     // ... provide data here
   *   ]
   * })
   * 
   * // Update zero or more WidgetMessages and only return the `id`
   * const widgetMessageWithIdOnly = await prisma.widgetMessage.updateManyAndReturn({
   *   select: { id: true },
   *   where: {
   *     // ... provide filter here
   *   },
   *   data: [
   *     // ... provide data here
   *   ]
   * })
   * Note, that providing `undefined` is treated as the value not being there.
   * Read more here: https://pris.ly/d/null-undefined
   * 
   */
  updateManyAndReturn<T extends WidgetMessageUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, WidgetMessageUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$WidgetMessagePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

  /**
   * Create or update one WidgetMessage.
   * @param {WidgetMessageUpsertArgs} args - Arguments to update or create a WidgetMessage.
   * @example
   * // Update or create a WidgetMessage
   * const widgetMessage = await prisma.widgetMessage.upsert({
   *   create: {
   *     // ... data to create a WidgetMessage
   *   },
   *   update: {
   *     // ... in case it already exists, update
   *   },
   *   where: {
   *     // ... the filter for the WidgetMessage we want to update
   *   }
   * })
   */
  upsert<T extends WidgetMessageUpsertArgs>(args: Prisma.SelectSubset<T, WidgetMessageUpsertArgs<ExtArgs>>): Prisma.Prisma__WidgetMessageClient<runtime.Types.Result.GetResult<Prisma.$WidgetMessagePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


  /**
   * Count the number of WidgetMessages.
   * Note, that providing `undefined` is treated as the value not being there.
   * Read more here: https://pris.ly/d/null-undefined
   * @param {WidgetMessageCountArgs} args - Arguments to filter WidgetMessages to count.
   * @example
   * // Count the number of WidgetMessages
   * const count = await prisma.widgetMessage.count({
   *   where: {
   *     // ... the filter for the WidgetMessages we want to count
   *   }
   * })
  **/
  count<T extends WidgetMessageCountArgs>(
    args?: Prisma.Subset<T, WidgetMessageCountArgs>,
  ): Prisma.PrismaPromise<
    T extends runtime.Types.Utils.Record<'select', any>
      ? T['select'] extends true
        ? number
        : Prisma.GetScalarType<T['select'], WidgetMessageCountAggregateOutputType>
      : number
  >

  /**
   * Allows you to perform aggregations operations on a WidgetMessage.
   * Note, that providing `undefined` is treated as the value not being there.
   * Read more here: https://pris.ly/d/null-undefined
   * @param {WidgetMessageAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
   * @example
   * // Ordered by age ascending
   * // Where email contains prisma.io
   * // Limited to the 10 users
   * const aggregations = await prisma.user.aggregate({
   *   _avg: {
   *     age: true,
   *   },
   *   where: {
   *     email: {
   *       contains: "prisma.io",
   *     },
   *   },
   *   orderBy: {
   *     age: "asc",
   *   },
   *   take: 10,
   * })
  **/
  aggregate<T extends WidgetMessageAggregateArgs>(args: Prisma.Subset<T, WidgetMessageAggregateArgs>): Prisma.PrismaPromise<GetWidgetMessageAggregateType<T>>

  /**
   * Group by WidgetMessage.
   * Note, that providing `undefined` is treated as the value not being there.
   * Read more here: https://pris.ly/d/null-undefined
   * @param {WidgetMessageGroupByArgs} args - Group by arguments.
   * @example
   * // Group by city, order by createdAt, get count
   * const result = await prisma.user.groupBy({
   *   by: ['city', 'createdAt'],
   *   orderBy: {
   *     createdAt: true
   *   },
   *   _count: {
   *     _all: true
   *   },
   * })
   * 
  **/
  groupBy<
    T extends WidgetMessageGroupByArgs,
    HasSelectOrTake extends Prisma.Or<
      Prisma.Extends<'skip', Prisma.Keys<T>>,
      Prisma.Extends<'take', Prisma.Keys<T>>
    >,
    OrderByArg extends Prisma.True extends HasSelectOrTake
      ? { orderBy: WidgetMessageGroupByArgs['orderBy'] }
      : { orderBy?: WidgetMessageGroupByArgs['orderBy'] },
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
  >(args: Prisma.SubsetIntersection<T, WidgetMessageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWidgetMessageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
/**
 * Fields of the WidgetMessage model
 */
readonly fields: WidgetMessageFieldRefs;
}

/**
 * The delegate class that acts as a "Promise-like" for WidgetMessage.
 * Why is this prefixed with `Prisma__`?
 * Because we want to prevent naming conflicts as mentioned in
 * https://github.com/prisma/prisma-client-js/issues/707
 */
export interface Prisma__WidgetMessageClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
  readonly [Symbol.toStringTag]: "PrismaPromise"
  conversation<T extends Prisma.WidgetConversationDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.WidgetConversationDefaultArgs<ExtArgs>>): Prisma.Prisma__WidgetConversationClient<runtime.Types.Result.GetResult<Prisma.$WidgetConversationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
  /**
   * Attaches callbacks for the resolution and/or rejection of the Promise.
   * @param onfulfilled The callback to execute when the Promise is resolved.
   * @param onrejected The callback to execute when the Promise is rejected.
   * @returns A Promise for the completion of which ever callback is executed.
   */
  then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>
  /**
   * Attaches a callback for only the rejection of the Promise.
   * @param onrejected The callback to execute when the Promise is rejected.
   * @returns A Promise for the completion of the callback.
   */
  catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>
  /**
   * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
   * resolved value cannot be modified from the callback.
   * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
   * @returns A Promise for the completion of the callback.
   */
  finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>
}




/**
 * Fields of the WidgetMessage model
 */
export interface WidgetMessageFieldRefs {
  readonly id: Prisma.FieldRef<"WidgetMessage", 'String'>
  readonly conversationId: Prisma.FieldRef<"WidgetMessage", 'String'>
  readonly sender: Prisma.FieldRef<"WidgetMessage", 'WidgetMessageSender'>
  readonly text: Prisma.FieldRef<"WidgetMessage", 'String'>
  readonly createdAt: Prisma.FieldRef<"WidgetMessage", 'DateTime'>
}
    

// Custom InputTypes
/**
 * WidgetMessage findUnique
 */
export type WidgetMessageFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  /**
   * Select specific fields to fetch from the WidgetMessage
   */
  select?: Prisma.WidgetMessageSelect<ExtArgs> | null
  /**
   * Omit specific fields from the WidgetMessage
   */
  omit?: Prisma.WidgetMessageOmit<ExtArgs> | null
  /**
   * Choose, which related nodes to fetch as well
   */
  include?: Prisma.WidgetMessageInclude<ExtArgs> | null
  /**
   * Filter, which WidgetMessage to fetch.
   */
  where: Prisma.WidgetMessageWhereUniqueInput
}

/**
 * WidgetMessage findUniqueOrThrow
 */
export type WidgetMessageFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  /**
   * Select specific fields to fetch from the WidgetMessage
   */
  select?: Prisma.WidgetMessageSelect<ExtArgs> | null
  /**
   * Omit specific fields from the WidgetMessage
   */
  omit?: Prisma.WidgetMessageOmit<ExtArgs> | null
  /**
   * Choose, which related nodes to fetch as well
   */
  include?: Prisma.WidgetMessageInclude<ExtArgs> | null
  /**
   * Filter, which WidgetMessage to fetch.
   */
  where: Prisma.WidgetMessageWhereUniqueInput
}

/**
 * WidgetMessage findFirst
 */
export type WidgetMessageFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  /**
   * Select specific fields to fetch from the WidgetMessage
   */
  select?: Prisma.WidgetMessageSelect<ExtArgs> | null
  /**
   * Omit specific fields from the WidgetMessage
   */
  omit?: Prisma.WidgetMessageOmit<ExtArgs> | null
  /**
   * Choose, which related nodes to fetch as well
   */
  include?: Prisma.WidgetMessageInclude<ExtArgs> | null
  /**
   * Filter, which WidgetMessage to fetch.
   */
  where?: Prisma.WidgetMessageWhereInput
  /**
   * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
   * 
   * Determine the order of WidgetMessages to fetch.
   */
  orderBy?: Prisma.WidgetMessageOrderByWithRelationInput | Prisma.WidgetMessageOrderByWithRelationInput[]
  /**
   * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
   * 
   * Sets the position for searching for WidgetMessages.
   */
  cursor?: Prisma.WidgetMessageWhereUniqueInput
  /**
   * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
   * 
   * Take `±n` WidgetMessages from the position of the cursor.
   */
  take?: number
  /**
   * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
   * 
   * Skip the first `n` WidgetMessages.
   */
  skip?: number
  /**
   * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
   * 
   * Filter by unique combinations of WidgetMessages.
   */
  distinct?: Prisma.WidgetMessageScalarFieldEnum | Prisma.WidgetMessageScalarFieldEnum[]
}

/**
 * WidgetMessage findFirstOrThrow
 */
export type WidgetMessageFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  /**
   * Select specific fields to fetch from the WidgetMessage
   */
  select?: Prisma.WidgetMessageSelect<ExtArgs> | null
  /**
   * Omit specific fields from the WidgetMessage
   */
  omit?: Prisma.WidgetMessageOmit<ExtArgs> | null
  /**
   * Choose, which related nodes to fetch as well
   */
  include?: Prisma.WidgetMessageInclude<ExtArgs> | null
  /**
   * Filter, which WidgetMessage to fetch.
   */
  where?: Prisma.WidgetMessageWhereInput
  /**
   * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
   * 
   * Determine the order of WidgetMessages to fetch.
   */
  orderBy?: Prisma.WidgetMessageOrderByWithRelationInput | Prisma.WidgetMessageOrderByWithRelationInput[]
  /**
   * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
   * 
   * Sets the position for searching for WidgetMessages.
   */
  cursor?: Prisma.WidgetMessageWhereUniqueInput
  /**
   * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
   * 
   * Take `±n` WidgetMessages from the position of the cursor.
   */
  take?: number
  /**
   * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
   * 
   * Skip the first `n` WidgetMessages.
   */
  skip?: number
  /**
   * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
   * 
   * Filter by unique combinations of WidgetMessages.
   */
  distinct?: Prisma.WidgetMessageScalarFieldEnum | Prisma.WidgetMessageScalarFieldEnum[]
}

/**
 * WidgetMessage findMany
 */
export type WidgetMessageFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  /**
   * Select specific fields to fetch from the WidgetMessage
   */
  select?: Prisma.WidgetMessageSelect<ExtArgs> | null
  /**
   * Omit specific fields from the WidgetMessage
   */
  omit?: Prisma.WidgetMessageOmit<ExtArgs> | null
  /**
   * Choose, which related nodes to fetch as well
   */
  include?: Prisma.WidgetMessageInclude<ExtArgs> | null
  /**
   * Filter, which WidgetMessages to fetch.
   */
  where?: Prisma.WidgetMessageWhereInput
  /**
   * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
   * 
   * Determine the order of WidgetMessages to fetch.
   */
  orderBy?: Prisma.WidgetMessageOrderByWithRelationInput | Prisma.WidgetMessageOrderByWithRelationInput[]
  /**
   * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
   * 
   * Sets the position for listing WidgetMessages.
   */
  cursor?: Prisma.WidgetMessageWhereUniqueInput
  /**
   * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
   * 
   * Take `±n` WidgetMessages from the position of the cursor.
   */
  take?: number
  /**
   * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
   * 
   * Skip the first `n` WidgetMessages.
   */
  skip?: number
  /**
   * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
   * 
   * Filter by unique combinations of WidgetMessages.
   */
  distinct?: Prisma.WidgetMessageScalarFieldEnum | Prisma.WidgetMessageScalarFieldEnum[]
}

/**
 * WidgetMessage create
 */
export type WidgetMessageCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  /**
   * Select specific fields to fetch from the WidgetMessage
   */
  select?: Prisma.WidgetMessageSelect<ExtArgs> | null
  /**
   * Omit specific fields from the WidgetMessage
   */
  omit?: Prisma.WidgetMessageOmit<ExtArgs> | null
  /**
   * Choose, which related nodes to fetch as well
   */
  include?: Prisma.WidgetMessageInclude<ExtArgs> | null
  /**
   * The data needed to create a WidgetMessage.
   */
  data: Prisma.XOR<Prisma.WidgetMessageCreateInput, Prisma.WidgetMessageUncheckedCreateInput>
}

/**
 * WidgetMessage createMany
 */
export type WidgetMessageCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  /**
   * The data used to create many WidgetMessages.
   */
  data: Prisma.WidgetMessageCreateManyInput | Prisma.WidgetMessageCreateManyInput[]
  skipDuplicates?: boolean
}

/**
 * WidgetMessage createManyAndReturn
 */
export type WidgetMessageCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  /**
   * Select specific fields to fetch from the WidgetMessage
   */
  select?: Prisma.WidgetMessageSelectCreateManyAndReturn<ExtArgs> | null
  /**
   * Omit specific fields from the WidgetMessage
   */
  omit?: Prisma.WidgetMessageOmit<ExtArgs> | null
  /**
   * The data used to create many WidgetMessages.
   */
  data: Prisma.WidgetMessageCreateManyInput | Prisma.WidgetMessageCreateManyInput[]
  skipDuplicates?: boolean
  /**
   * Choose, which related nodes to fetch as well
   */
  include?: Prisma.WidgetMessageIncludeCreateManyAndReturn<ExtArgs> | null
}

/**
 * WidgetMessage update
 */
export type WidgetMessageUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  /**
   * Select specific fields to fetch from the WidgetMessage
   */
  select?: Prisma.WidgetMessageSelect<ExtArgs> | null
  /**
   * Omit specific fields from the WidgetMessage
   */
  omit?: Prisma.WidgetMessageOmit<ExtArgs> | null
  /**
   * Choose, which related nodes to fetch as well
   */
  include?: Prisma.WidgetMessageInclude<ExtArgs> | null
  /**
   * The data needed to update a WidgetMessage.
   */
  data: Prisma.XOR<Prisma.WidgetMessageUpdateInput, Prisma.WidgetMessageUncheckedUpdateInput>
  /**
   * Choose, which WidgetMessage to update.
   */
  where: Prisma.WidgetMessageWhereUniqueInput
}

/**
 * WidgetMessage updateMany
 */
export type WidgetMessageUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  /**
   * The data used to update WidgetMessages.
   */
  data: Prisma.XOR<Prisma.WidgetMessageUpdateManyMutationInput, Prisma.WidgetMessageUncheckedUpdateManyInput>
  /**
   * Filter which WidgetMessages to update
   */
  where?: Prisma.WidgetMessageWhereInput
  /**
   * Limit how many WidgetMessages to update.
   */
  limit?: number
}

/**
 * WidgetMessage updateManyAndReturn
 */
export type WidgetMessageUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  /**
   * Select specific fields to fetch from the WidgetMessage
   */
  select?: Prisma.WidgetMessageSelectUpdateManyAndReturn<ExtArgs> | null
  /**
   * Omit specific fields from the WidgetMessage
   */
  omit?: Prisma.WidgetMessageOmit<ExtArgs> | null
  /**
   * The data used to update WidgetMessages.
   */
  data: Prisma.XOR<Prisma.WidgetMessageUpdateManyMutationInput, Prisma.WidgetMessageUncheckedUpdateManyInput>
  /**
   * Filter which WidgetMessages to update
   */
  where?: Prisma.WidgetMessageWhereInput
  /**
   * Limit how many WidgetMessages to update.
   */
  limit?: number
  /**
   * Choose, which related nodes to fetch as well
   */
  include?: Prisma.WidgetMessageIncludeUpdateManyAndReturn<ExtArgs> | null
}

/**
 * WidgetMessage upsert
 */
export type WidgetMessageUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  /**
   * Select specific fields to fetch from the WidgetMessage
   */
  select?: Prisma.WidgetMessageSelect<ExtArgs> | null
  /**
   * Omit specific fields from the WidgetMessage
   */
  omit?: Prisma.WidgetMessageOmit<ExtArgs> | null
  /**
   * Choose, which related nodes to fetch as well
   */
  include?: Prisma.WidgetMessageInclude<ExtArgs> | null
  /**
   * The filter to search for the WidgetMessage to update in case it exists.
   */
  where: Prisma.WidgetMessageWhereUniqueInput
  /**
   * In case the WidgetMessage found by the `where` argument doesn't exist, create a new WidgetMessage with this data.
   */
  create: Prisma.XOR<Prisma.WidgetMessageCreateInput, Prisma.WidgetMessageUncheckedCreateInput>
  /**
   * In case the WidgetMessage was found with the provided `where` argument, update it with this data.
   */
  update: Prisma.XOR<Prisma.WidgetMessageUpdateInput, Prisma.WidgetMessageUncheckedUpdateInput>
}

/**
 * WidgetMessage delete
 */
export type WidgetMessageDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  /**
   * Select specific fields to fetch from the WidgetMessage
   */
  select?: Prisma.WidgetMessageSelect<ExtArgs> | null
  /**
   * Omit specific fields from the WidgetMessage
   */
  omit?: Prisma.WidgetMessageOmit<ExtArgs> | null
  /**
   * Choose, which related nodes to fetch as well
   */
  include?: Prisma.WidgetMessageInclude<ExtArgs> | null
  /**
   * Filter which WidgetMessage to delete.
   */
  where: Prisma.WidgetMessageWhereUniqueInput
}

/**
 * WidgetMessage deleteMany
 */
export type WidgetMessageDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  /**
   * Filter which WidgetMessages to delete
   */
  where?: Prisma.WidgetMessageWhereInput
  /**
   * Limit how many WidgetMessages to delete.
   */
  limit?: number
}

/**
 * WidgetMessage without action
 */
export type WidgetMessageDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
  /**
   * Select specific fields to fetch from the WidgetMessage
   */
  select?: Prisma.WidgetMessageSelect<ExtArgs> | null
  /**
   * Omit specific fields from the WidgetMessage
   */
  omit?: Prisma.WidgetMessageOmit<ExtArgs> | null
  /**
   * Choose, which related nodes to fetch as well
   */
  include?: Prisma.WidgetMessageInclude<ExtArgs> | null
}
