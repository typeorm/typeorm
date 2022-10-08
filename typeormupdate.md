---
Checks:          'clang-diagnostic-*,clang-analyzer-*,bugprone-*,concurrency-*,-modernize-use-trailing-return-type'
WarningsAsErrors: ''
HeaderFilterRegex: ''
AnalyzeTemporaryDtors: false
FormatStyle:     none
User:            fred
CheckOptions:
  - key:             bugprone-string-constructor.LargeLengthThreshold
    value:           '8388608'
  - key:             modernize-replace-auto-ptr.IncludeStyle
    value:           llvm
  - key:             bugprone-reserved-identifier.Invert
    value:           'false'
  - key:             bugprone-implicit-widening-of-multiplication-result.UseCXXStaticCastsInCppSources
    value:           'true'
  - key:             cert-oop54-cpp.WarnOnlyIfThisHasSuspiciousField
    value:           'false'
  - key:             bugprone-exception-escape.FunctionsThatShouldNotThrow
    value:           ''
  - key:             cert-dcl16-c.NewSuffixes
    value:           'L;LL;LU;LLU'
  - key:             bugprone-narrowing-conversions.WarnOnFloatingPointNarrowingConversion
    value:           'true'
  - key:             modernize-loop-convert.MaxCopySize
    value:           '16'
  - key:             bugprone-narrowing-conversions.PedanticMode
    value:           'false'
  - key:             bugprone-unused-return-value.CheckedFunctions
    value:           '::std::async;::std::launder;::std::remove;::std::remove_if;::std::unique;::std::unique_ptr::release;::std::basic_string::empty;::std::vector::empty;::std::back_inserter;::std::distance;::std::find;::std::find_if;::std::inserter;::std::lower_bound;::std::make_pair;::std::map::count;::std::map::find;::std::map::lower_bound;::std::multimap::equal_range;::std::multimap::upper_bound;::std::set::count;::std::set::find;::std::setfill;::std::setprecision;::std::setw;::std::upper_bound;::std::vector::at;::bsearch;::ferror;::feof;::isalnum;::isalpha;::isblank;::iscntrl;::isdigit;::isgraph;::islower;::isprint;::ispunct;::isspace;::isupper;::iswalnum;::iswprint;::iswspace;::isxdigit;::memchr;::memcmp;::strcmp;::strcoll;::strncmp;::strpbrk;::strrchr;::strspn;::strstr;::wcscmp;::access;::bind;::connect;::difftime;::dlsym;::fnmatch;::getaddrinfo;::getopt;::htonl;::htons;::iconv_open;::inet_addr;::isascii;::isatty;::mmap;::newlocale;::openat;::pathconf;::pthread_equal;::pthread_getspecific;::pthread_mutex_trylock;::readdir;::readlink;::recvmsg;::regexec;::scandir;::semget;::setjmp;::shm_open;::shmget;::sigismember;::strcasecmp;::strsignal;::ttyname'
  - key:             bugprone-signed-char-misuse.CharTypdefsToIgnore
    value:           ''
  - key:             bugprone-argument-comment.CommentStringLiterals
    value:           '0'
  - key:             cppcoreguidelines-explicit-virtual-functions.IgnoreDestructors
    value:           'true'
  - key:             bugprone-easily-swappable-parameters.MinimumLength
    value:           '2'
  - key:             bugprone-sizeof-expression.WarnOnSizeOfConstant
    value:           'true'
  - key:             bugprone-argument-comment.CommentBoolLiterals
    value:           '0'
  - key:             bugprone-argument-comment.CommentUserDefinedLiterals
    value:           '0'
  - key:             cert-str34-c.DiagnoseSignedUnsignedCharComparisons
    value:           'false'
  - key:             bugprone-narrowing-conversions.WarnWithinTemplateInstantiation
    value:           'false'
  - key:             concurrency-mt-unsafe.FunctionSet
    value:           any
  - key:             bugprone-suspicious-string-compare.WarnOnLogicalNotComparison
    value:           'false'
  - key:             google-readability-braces-around-statements.ShortStatementLines
    value:           '1'
  - key:             bugprone-reserved-identifier.AllowedIdentifiers
    value:           ''
  - key:             bugprone-easily-swappable-parameters.IgnoredParameterTypeSuffixes
    value:           'bool;Bool;_Bool;it;It;iterator;Iterator;inputit;InputIt;forwardit;FowardIt;bidirit;BidirIt;constiterator;const_iterator;Const_Iterator;Constiterator;ConstIterator;RandomIt;randomit;random_iterator;ReverseIt;reverse_iterator;reverse_const_iterator;ConstReverseIterator;Const_Reverse_Iterator;const_reverse_iterator;Constreverseiterator;constreverseiterator'
  - key:             bugprone-easily-swappable-parameters.QualifiersMix
    value:           'false'
  - key:             bugprone-signal-handler.AsyncSafeFunctionSet
    value:           POSIX
  - key:             bugprone-easily-swappable-parameters.ModelImplicitConversions
    value:           'true'
  - key:             bugprone-suspicious-string-compare.WarnOnImplicitComparison
    value:           'true'
  - key:             bugprone-argument-comment.CommentNullPtrs
    value:           '0'
  - key:             bugprone-easily-swappable-parameters.SuppressParametersUsedTogether
    value:           'true'
  - key:             bugprone-argument-comment.StrictMode
    value:           '0'
  - key:             bugprone-misplaced-widening-cast.CheckImplicitCasts
    value:           'false'
  - key:             bugprone-suspicious-missing-comma.RatioThreshold
    value:           '0.200000'
  - key:             modernize-loop-convert.MinConfidence
    value:           reasonable
  - key:             bugprone-easily-swappable-parameters.NamePrefixSuffixSilenceDissimilarityTreshold
    value:           '1'
  - key:             bugprone-unhandled-self-assignment.WarnOnlyIfThisHasSuspiciousField
    value:           'true'
  - key:             google-readability-namespace-comments.ShortNamespaceLines
    value:           '10'
  - key:             google-readability-namespace-comments.SpacesBeforeComments
    value:           '2'
  - key:             cppcoreguidelines-non-private-member-variables-in-classes.IgnoreClassesWithAllMemberVariablesBeingPublic
    value:           'true'
  - key:             bugprone-argument-comment.IgnoreSingleArgument
    value:           '0'
  - key:             bugprone-suspicious-string-compare.StringCompareLikeFunctions
    value:           ''
  - key:             bugprone-narrowing-conversions.WarnOnEquivalentBitWidth
    value:           'true'
  - key:             bugprone-sizeof-expression.WarnOnSizeOfIntegerExpression
    value:           'false'
  - key:             bugprone-assert-side-effect.CheckFunctionCalls
    value:           'false'
  - key:             bugprone-easily-swappable-parameters.IgnoredParameterNames
    value:           '"";iterator;Iterator;begin;Begin;end;End;first;First;last;Last;lhs;LHS;rhs;RHS'
  - key:             bugprone-narrowing-conversions.IgnoreConversionFromTypes
    value:           ''
  - key:             bugprone-string-constructor.StringNames
    value:           '::std::basic_string;::std::basic_string_view'
  - key:             bugprone-assert-side-effect.AssertMacros
    value:           assert,NSAssert,NSCAssert
  - key:             bugprone-exception-escape.IgnoredExceptions
    value:           ''
  - key:             bugprone-signed-char-misuse.DiagnoseSignedUnsignedCharComparisons
    value:           'true'
  - key:             llvm-qualified-auto.AddConstToQualified
    value:           'false'
  - key:             bugprone-narrowing-conversions.WarnOnIntegerNarrowingConversion
    value:           'true'
  - key:             modernize-loop-convert.NamingStyle
    value:           CamelCase
  - key:             bugprone-suspicious-include.ImplementationFileExtensions
    value:           'c;cc;cpp;cxx'
  - key:             bugprone-suspicious-missing-comma.SizeThreshold
    value:           '5'
  - key:             bugprone-suspicious-include.HeaderFileExtensions
    value:           ';h;hh;hpp;hxx'
  - key:             google-readability-function-size.StatementThreshold
    value:           '800'
  - key:             llvm-else-after-return.WarnOnConditionVariables
    value:           'false'
  - key:             bugprone-argument-comment.CommentCharacterLiterals
    value:           '0'
  - key:             bugprone-argument-comment.CommentIntegerLiterals
    value:           '0'
  - key:             bugprone-sizeof-expression.WarnOnSizeOfCompareToConstant
    value:           'true'
  - key:             modernize-pass-by-value.IncludeStyle
    value:           llvm
  - key:             bugprone-reserved-identifier.AggressiveDependentMemberLookup
    value:           'false'
  - key:             bugprone-sizeof-expression.WarnOnSizeOfThis
    value:           'true'
  - key:             bugprone-string-constructor.WarnOnLargeLength
    value:           'true'
  - key:             bugprone-too-small-loop-variable.MagnitudeBitsUpperLimit
    value:           '16'
  - key:             bugprone-argument-comment.CommentFloatLiterals
    value:           '0'
  - key:             modernize-use-nullptr.NullMacros
    value:           'NULL'
  - key:             bugprone-dangling-handle.HandleClasses
    value:           'std::basic_string_view;std::experimental::basic_string_view'
  - key:             bugprone-dynamic-static-initializers.HeaderFileExtensions
    value:           ';h;hh;hpp;hxx'
  - key:             bugprone-suspicious-enum-usage.StrictMode
    value:           'false'
  - key:             bugprone-implicit-widening-of-multiplication-result.IncludeStyle
    value:           llvm
  - key:             bugprone-suspicious-missing-comma.MaxConcatenatedTokens
    value:           '5'
  - key:             bugprone-implicit-widening-of-multiplication-result.UseCXXHeadersInCppSources
    value:           'true'
  - key:             llvm-else-after-return.WarnOnUnfixable
    value:           'false'
  - key:             bugprone-not-null-terminated-result.WantToUseSafeFunctions
    value:           'true'
...
