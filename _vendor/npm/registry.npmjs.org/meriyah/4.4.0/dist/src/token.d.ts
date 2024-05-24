export declare const enum Token {
    Type = 255,
    PrecStart = 8,
    Precedence = 3840,
    Keyword = 4096,
    Contextual = 12288,
    Reserved = 20480,
    FutureReserved = 36864,
    IsExpressionStart = 65536,
    IsIdentifier = 143360,
    IsInOrOf = 262144,
    IsLogical = 524288,
    IsAutoSemicolon = 1048576,
    IsPatternStart = 2097152,
    IsAssignOp = 4194304,
    IsBinaryOp = 8454144,
    IsUnaryOp = 16842752,
    IsUpdateOp = 33619968,
    IsMemberOrCallExpression = 67108864,
    IsStringOrNumber = 134217728,
    IsCoalesc = 268435456,
    IsEvalOrArguments = 537079808,
    IsClassField = 1073741824,
    EOF = 1048576,
    Identifier = 208897,
    NumericLiteral = 134283266,
    StringLiteral = 134283267,
    RegularExpression = 65540,
    FalseKeyword = 86021,
    TrueKeyword = 86022,
    NullKeyword = 86023,
    TemplateContinuation = 67174408,
    TemplateSpan = 67174409,
    Arrow = 10,
    LeftParen = 67174411,
    LeftBrace = 2162700,
    Period = 67108877,
    Ellipsis = 14,
    RightBrace = 1074790415,
    RightParen = 16,
    Semicolon = 1074790417,
    Comma = 18,
    LeftBracket = 69271571,
    RightBracket = 20,
    Colon = 21,
    QuestionMark = 22,
    SingleQuote = 23,
    DoubleQuote = 24,
    JSXClose = 25,
    JSXAutoClose = 26,
    Increment = 33619995,
    Decrement = 33619996,
    Assign = 1077936157,
    ShiftLeftAssign = 4194334,
    ShiftRightAssign = 4194335,
    LogicalShiftRightAssign = 4194336,
    ExponentiateAssign = 4194337,
    AddAssign = 4194338,
    SubtractAssign = 4194339,
    MultiplyAssign = 4194340,
    DivideAssign = 4259877,
    ModuloAssign = 4194342,
    BitwiseXorAssign = 4194343,
    BitwiseOrAssign = 4194344,
    BitwiseAndAssign = 4194345,
    LogicalOrAssign = 4194346,
    LogicalAndAssign = 4194347,
    CoalesceAssign = 4194348,
    TypeofKeyword = 16863277,
    DeleteKeyword = 16863278,
    VoidKeyword = 16863279,
    Negate = 16842800,
    Complement = 16842801,
    Add = 25233970,
    Subtract = 25233971,
    InKeyword = 8738868,
    InstanceofKeyword = 8476725,
    Multiply = 8457014,
    Modulo = 8457015,
    Divide = 8457016,
    Exponentiate = 8457273,
    LogicalAnd = 8979258,
    LogicalOr = 8979003,
    StrictEqual = 8455996,
    StrictNotEqual = 8455997,
    LooseEqual = 8455998,
    LooseNotEqual = 8455999,
    LessThanOrEqual = 8456256,
    GreaterThanOrEqual = 8456257,
    LessThan = 8456258,
    GreaterThan = 8456259,
    ShiftLeft = 8456516,
    ShiftRight = 8456517,
    LogicalShiftRight = 8456518,
    BitwiseAnd = 8455751,
    BitwiseOr = 8455240,
    BitwiseXor = 8455497,
    VarKeyword = 86090,
    LetKeyword = 241739,
    ConstKeyword = 86092,
    BreakKeyword = 20557,
    CaseKeyword = 20558,
    CatchKeyword = 20559,
    ClassKeyword = 86096,
    ContinueKeyword = 20561,
    DebuggerKeyword = 20562,
    DefaultKeyword = 20563,
    DoKeyword = 20564,
    ElseKeyword = 20565,
    ExportKeyword = 20566,
    ExtendsKeyword = 20567,
    FinallyKeyword = 20568,
    ForKeyword = 20569,
    FunctionKeyword = 86106,
    IfKeyword = 20571,
    ImportKeyword = 86108,
    NewKeyword = 86109,
    ReturnKeyword = 20574,
    SuperKeyword = 86111,
    SwitchKeyword = 86112,
    ThisKeyword = 86113,
    ThrowKeyword = 86114,
    TryKeyword = 20579,
    WhileKeyword = 20580,
    WithKeyword = 20581,
    ImplementsKeyword = 36966,
    InterfaceKeyword = 36967,
    PackageKeyword = 36968,
    PrivateKeyword = 36969,
    ProtectedKeyword = 36970,
    PublicKeyword = 36971,
    StaticKeyword = 36972,
    YieldKeyword = 241773,
    AsKeyword = 77934,
    AsyncKeyword = 209007,
    AwaitKeyword = 209008,
    ConstructorKeyword = 12401,
    GetKeyword = 12402,
    SetKeyword = 12403,
    FromKeyword = 12404,
    OfKeyword = 274549,
    EnumKeyword = 86134,
    Eval = 537079927,
    Arguments = 537079928,
    EscapedReserved = 121,
    EscapedFutureReserved = 122,
    AnyIdentifier = 143483,
    PrivateIdentifier = 124,
    BigIntLiteral = 134283389,
    Coalesce = 276889982,
    QuestionMarkPeriod = 67108991,
    WhiteSpace = 128,
    Illegal = 129,
    CarriageReturn = 130,
    PrivateField = 131,
    Template = 132,
    Decorator = 133,
    Target = 143494,
    Meta = 143495,
    LineFeed = 136,
    EscapedIdentifier = 137,
    JSXText = 138
}
export declare const KeywordDescTable: string[];
export declare const descKeywordTable: {
    [key: string]: Token;
};
//# sourceMappingURL=token.d.ts.map