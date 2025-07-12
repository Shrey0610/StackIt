import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Button,
  Card,
  CardContent,
  Box,
  ThemeProvider,
  createTheme,
  CssBaseline,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  Stack,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  FormControl,
  Select,
  Pagination,
  Divider,
  Collapse,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Search,
  Notifications,
  Add,
  KeyboardArrowDown,
  ArrowUpward,
  ArrowDownward,
  Comment,
  Bookmark,
  Person,
  ExpandMore,
  ExpandLess,
  Home,
  NavigateNext,
  FormatBold,
  FormatItalic,
  FormatListBulleted,
  FormatListNumbered,
  EmojiEmotions,
  Link as LinkIcon,
  Image,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight
} from '@mui/icons-material';

// Modern theme with updated colors
const theme = createTheme({
  palette: {
    primary: {
      main: '#6366f1', // Modern indigo
    },
    secondary: {
      main: '#ec4899', // Vibrant pink
    },
    background: {
      default: '#f8fafc',
    },
  },
  typography: {
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
  },
});

// Mock data for questions
const mockQuestions = [
  {
    id: 1,
    title: "How to join 2 columns in a data set to make a separate column in SQL",
    description: "I do not know the code for it as I am a beginner. As an example what I need to do is like there is a column 1 containing First name, and column 2 consists of last name I want a column to combine ...",
    tags: ["sql", "database"],
    user: "John Doe",
    answers: 5,
    votes: 12,
    views: 234,
    timeAgo: "2 hours ago",
    answersData: [
      {
        id: 1,
        content: "The || Operator.\nThe + Operator.\nThe CONCAT Function.",
        author: "SQL Expert",
        votes: 8,
        timeAgo: "1 hour ago",
        isAccepted: true
      },
      {
        id: 2,
        content: "You can use CONCAT function to combine multiple columns. Here are the details...",
        author: "Database Pro",
        votes: 3,
        timeAgo: "30 minutes ago",
        isAccepted: false
      }
    ]
  },
  {
    id: 2,
    title: "React useState not updating state immediately",
    description: "I'm having trouble with useState hook not updating the state immediately when I call the setter function. The component doesn't re-render with the new value...",
    tags: ["react", "javascript", "hooks"],
    user: "Jane Smith",
    answers: 3,
    votes: 8,
    views: 156,
    timeAgo: "4 hours ago",
    answersData: [
      {
        id: 1,
        content: "useState is asynchronous. Use useEffect to see the updated value.",
        author: "React Dev",
        votes: 5,
        timeAgo: "2 hours ago",
        isAccepted: false
      }
    ]
  },
  {
    id: 3,
    title: "Python list comprehension with multiple conditions",
    description: "How can I create a list comprehension with multiple if conditions? I want to filter items based on multiple criteria...",
    tags: ["python", "list-comprehension"],
    user: "Mike Johnson",
    answers: 2,
    votes: 15,
    views: 89,
    timeAgo: "1 day ago",
    answersData: [
      {
        id: 1,
        content: "Use multiple if conditions like: [x for x in list if condition1 if condition2]",
        author: "Python Guru",
        votes: 10,
        timeAgo: "12 hours ago",
        isAccepted: true
      }
    ]
  },
  {
    id: 4,
    title: "How to center a div using CSS Grid?",
    description: "I'm trying to center a div both horizontally and vertically using CSS Grid, but I can't seem to get it right. What's the proper way to do this?",
    tags: ["css", "css-grid", "layout"],
    user: "Alex Brown",
    answers: 0,
    votes: 3,
    views: 45,
    timeAgo: "3 hours ago",
    answersData: []
  },
  {
    id: 5,
    title: "Best practices for API error handling in Node.js",
    description: "What are the recommended approaches for handling errors in a REST API built with Node.js and Express? Should I use try-catch blocks everywhere?",
    tags: ["nodejs", "express", "error-handling", "api"],
    user: "Sarah Wilson",
    answers: 0,
    votes: 7,
    views: 123,
    timeAgo: "5 hours ago",
    answersData: []
  }
];

function App() {
  const [questions, setQuestions] = useState(mockQuestions);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('Newest');
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [notifications] = useState(3); // Mock notification count
  const [currentView, setCurrentView] = useState('questions'); // 'questions' or 'question-detail'
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [newAnswer, setNewAnswer] = useState('');
  const [askQuestionOpen, setAskQuestionOpen] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    title: '',
    description: '',
    tags: ''
  });
  const [answerSubmitted, setAnswerSubmitted] = useState(false);

  const handleNotificationClick = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleQuestionClick = (question) => {
    setSelectedQuestion(question);
    setCurrentView('question-detail');
  };

  const handleBackToQuestions = () => {
    setCurrentView('questions');
    setSelectedQuestion(null);
  };

  const handleAnswerVote = (questionId, answerId, type) => {
    // Handle answer voting logic here
    console.log(`Voted ${type} on answer ${answerId} for question ${questionId}`);
  };

  const handleAskQuestionOpen = () => {
    setAskQuestionOpen(true);
  };

  const handleAskQuestionClose = () => {
    setAskQuestionOpen(false);
    setQuestionForm({ title: '', description: '', tags: '' });
  };

  const handleQuestionFormChange = (field, value) => {
    setQuestionForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitQuestion = () => {
    // For now, just log the form data
    console.log('Submitting question:', questionForm);
    // Close the modal
    handleAskQuestionClose();
  };

  const handleSubmitAnswer = () => {
    if (!newAnswer.trim()) {
      alert('Please write an answer before submitting.');
      return;
    }

    // Create a new answer object
    const newAnswerObj = {
      id: Date.now(), // Simple ID generation
      content: newAnswer,
      author: 'Current User', // In a real app, this would come from auth
      votes: 0,
      timeAgo: 'just now',
      isAccepted: false
    };

    // Update the questions state
    setQuestions(prevQuestions =>
      prevQuestions.map(question =>
        question.id === selectedQuestion.id
          ? {
            ...question,
            answers: question.answers + 1,
            answersData: [...(question.answersData || []), newAnswerObj]
          }
          : question
      )
    );

    // Update the selected question state
    const updatedQuestion = {
      ...selectedQuestion,
      answers: selectedQuestion.answers + 1,
      answersData: [...(selectedQuestion.answersData || []), newAnswerObj]
    };
    setSelectedQuestion(updatedQuestion);

    // Clear the answer input
    setNewAnswer('');

    // Show success message
    setAnswerSubmitted(true);
    setTimeout(() => setAnswerSubmitted(false), 3000); // Hide after 3 seconds
  };

  const handleCancelAnswer = () => {
    setNewAnswer('');
  };

  // Filter questions based on search term
  const filteredQuestions = questions.filter(question => {
    if (!searchTerm.trim()) return true; // Show all questions if no search term

    const searchLower = searchTerm.toLowerCase();
    return (
      question.title.toLowerCase().includes(searchLower) ||
      question.description.toLowerCase().includes(searchLower) ||
      question.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
      question.user.toLowerCase().includes(searchLower)
    );
  });

  // Sort and filter questions based on sortBy
  const sortedAndFilteredQuestions = [...filteredQuestions].filter(question => {
    // Apply filter based on sortBy
    switch (sortBy) {
      case 'Unanswered':
        return question.answers === 0;
      case 'Most Voted':
        return true; // Show all, will be sorted by votes
      case 'Most Viewed':
        return true; // Show all, will be sorted by views
      case 'Newest':
      default:
        return true; // Show all for newest
    }
  }).sort((a, b) => {
    // Apply sorting based on sortBy
    switch (sortBy) {
      case 'Most Voted':
        return b.votes - a.votes;
      case 'Most Viewed':
        return b.views - a.views;
      case 'Unanswered':
      case 'Newest':
      default:
        // Sort by newest (assuming questions with lower id are newer)
        return a.id - b.id;
    }
  });

  const QuestionDetailPage = ({ question }) => (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
      <Box display="flex" flexDirection={{ xs: 'column', lg: 'row' }} gap={3}>
        {/* Main Question Content */}
        <Box flex={1}>
          {/* Breadcrumb */}
          <Breadcrumbs
            separator={<NavigateNext fontSize="small" />}
            sx={{ mb: 3 }}
          >
            <Link
              component="button"
              variant="body2"
              onClick={handleBackToQuestions}
              sx={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                color: '#6366f1',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              <Home sx={{ mr: 0.5, fontSize: 16 }} />
              Questions
            </Link>
            <Typography variant="body2" color="text.primary">
              {question.title.length > 30 ? question.title.substring(0, 30) + '...' : question.title}
            </Typography>
          </Breadcrumbs>

          {/* Question Header */}
          <Typography variant={{ xs: 'h5', sm: 'h4' }} sx={{ mb: 2, fontWeight: 500 }}>
            {question.title}
          </Typography>

          {/* Question Meta Info */}
          <Box display="flex" flexWrap="wrap" gap={2} mb={3}>
            <Typography variant="body2" color="text.secondary">
              Asked {question.timeAgo}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Viewed {question.views} times
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {question.answers} answers
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Question Content */}
          <Card sx={{ mb: 4, bgcolor: '#fafafa' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box display="flex" gap={2}>
                {/* Question Voting */}
                <Box display="flex" flexDirection="column" alignItems="center" minWidth={60}>
                  <IconButton size="small">
                    <ArrowUpward fontSize="small" sx={{ fontWeight: 'bold' }} />
                  </IconButton>
                  <Typography variant="h6" fontWeight="bold">
                    {question.votes}
                  </Typography>
                  <IconButton size="small">
                    <ArrowDownward fontSize="small" sx={{ fontWeight: 'bold' }} />
                  </IconButton>
                  <IconButton size="small" sx={{ mt: 2 }}>
                    <Bookmark fontSize="small" />
                  </IconButton>
                </Box>

                {/* Question Body */}
                <Box flex={1}>
                  <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
                    {question.description}
                  </Typography>

                  {/* Tags */}
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 3 }}>
                    {question.tags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        size="medium"
                        sx={{
                          bgcolor: '#e0e7ff',
                          color: '#6366f1',
                          '&:hover': { bgcolor: '#c7d2fe' }
                        }}
                      />
                    ))}
                  </Stack>

                  {/* Question Author */}
                  <Box display="flex" justifyContent="flex-end">
                    <Card sx={{ p: 2, bgcolor: '#e0e7ff', maxWidth: 200 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        asked {question.timeAgo}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {question.user.charAt(0)}
                        </Avatar>
                        <Typography variant="body2" fontWeight="bold">
                          {question.user}
                        </Typography>
                      </Box>
                    </Card>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Answers Section */}
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 500 }}>
            {question.answersData?.length || 0} Answers
          </Typography>

          {question.answersData?.map((answer) => (
            <Card key={answer.id} sx={{ mb: 3 }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box display="flex" gap={2}>
                  {/* Answer Voting */}
                  <Box display="flex" flexDirection="column" alignItems="center" minWidth={60}>
                    <IconButton
                      size="small"
                      onClick={() => handleAnswerVote(question.id, answer.id, 'up')}
                    >
                      <ArrowUpward fontSize="small" sx={{ fontWeight: 'bold' }} />
                    </IconButton>
                    <Typography variant="h6" fontWeight="bold">
                      {answer.votes}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleAnswerVote(question.id, answer.id, 'down')}
                    >
                      <ArrowDownward fontSize="small" sx={{ fontWeight: 'bold' }} />
                    </IconButton>
                    {answer.isAccepted && (
                      <Chip
                        label="✓ Accepted"
                        size="small"
                        color="success"
                        sx={{ mt: 2, fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>

                  {/* Answer Content */}
                  <Box flex={1}>
                    <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                      {answer.content}
                    </Typography>

                    <Box display="flex" justifyContent="flex-end">
                      <Card sx={{ p: 2, bgcolor: '#f0f9ff', maxWidth: 200 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          answered {answer.timeAgo}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {answer.author.charAt(0)}
                          </Avatar>
                          <Typography variant="body2" fontWeight="bold">
                            {answer.author}
                          </Typography>
                        </Box>
                      </Card>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}

          {/* Submit Answer Section */}
          <Box mt={5}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 500 }}>
              Your Answer
            </Typography>

            {/* Rich Text Editor Toolbar */}
            <Box
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: '4px 4px 0 0',
                p: 1.5,
                bgcolor: '#f5f5f5',
                display: 'flex',
                gap: 1,
                flexWrap: 'wrap'
              }}
            >
              <IconButton size="small"><FormatBold /></IconButton>
              <IconButton size="small"><FormatItalic /></IconButton>
              <Divider orientation="vertical" flexItem />
              <IconButton size="small"><FormatListBulleted /></IconButton>
              <IconButton size="small"><FormatListNumbered /></IconButton>
              <Divider orientation="vertical" flexItem />
              <IconButton size="small"><EmojiEmotions /></IconButton>
              <IconButton size="small"><LinkIcon /></IconButton>
              <IconButton size="small"><Image /></IconButton>
              <Divider orientation="vertical" flexItem />
              <IconButton size="small"><FormatAlignLeft /></IconButton>
              <IconButton size="small"><FormatAlignCenter /></IconButton>
              <IconButton size="small"><FormatAlignRight /></IconButton>
            </Box>

            {/* Answer Text Area */}
            <TextField
              fullWidth
              multiline
              rows={8}
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              placeholder="Write your answer here..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '0 0 4px 4px',
                  '& fieldset': {
                    borderTop: 'none',
                  },
                },
              }}
            />

            {/* Success Message */}
            {answerSubmitted && (
              <Box
                mt={2}
                p={2}
                sx={{
                  bgcolor: '#d1fae5',
                  border: '1px solid #10b981',
                  borderRadius: 2,
                  color: '#065f46'
                }}
              >
                <Typography variant="body2" fontWeight="medium">
                  ✓ Your answer has been posted successfully!
                </Typography>
              </Box>
            )}

            <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
              <Button
                variant="outlined"
                sx={{ textTransform: 'none' }}
                onClick={handleCancelAnswer}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmitAnswer}
                disabled={!newAnswer.trim()}
                sx={{
                  bgcolor: '#6366f1',
                  '&:hover': { bgcolor: '#4f46e5' },
                  textTransform: 'none',
                  '&:disabled': {
                    bgcolor: '#9ca3af',
                    color: '#ffffff'
                  }
                }}
              >
                Post Your Answer
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Sidebar for Question Detail */}
        <Box width={{ xs: '100%', lg: 300 }} sx={{ order: { xs: -1, lg: 1 } }}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Related Questions
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={1}>
                <Link href="#" variant="body2" color="primary">
                  How to concatenate strings in SQL?
                </Link>
                <Link href="#" variant="body2" color="primary">
                  SQL JOIN vs UNION differences
                </Link>
                <Link href="#" variant="body2" color="primary">
                  Best practices for SQL queries
                </Link>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Question Stats
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={1}>
                <Typography variant="body2">
                  Asked: {question.timeAgo}
                </Typography>
                <Typography variant="body2">
                  Viewed: {question.views} times
                </Typography>
                <Typography variant="body2">
                  Active: {question.timeAgo}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Container>
  );

  const QuestionCard = ({ question }) => (
    <Card
      sx={{ mb: 2, '&:hover': { boxShadow: 3 }, cursor: 'pointer' }}
      onClick={() => handleQuestionClick(question)}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
          {/* Vote/Answer Stats */}
          <Box
            display="flex"
            flexDirection={{ xs: 'row', sm: 'column' }}
            alignItems="center"
            justifyContent={{ xs: 'space-around', sm: 'center' }}
            minWidth={{ xs: 'auto', sm: 80 }}
            sx={{ order: { xs: 2, sm: 1 } }}
          >
            <Typography variant="body2" color="text.secondary" textAlign="center">
              {question.votes} votes
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              {question.answers} answers
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              {question.views} views
            </Typography>
          </Box>

          {/* Question Content */}
          <Box flex={1} sx={{ order: { xs: 1, sm: 2 } }}>
            <Typography
              variant={{ xs: 'subtitle1', sm: 'h6' }}
              component="h3"
              sx={{ mb: 1, color: '#6366f1', fontWeight: 500 }}
            >
              {question.title}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 2,
                display: '-webkit-box',
                WebkitLineClamp: { xs: 2, sm: 3 },
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {question.description}
            </Typography>

            {/* Tags and User Info */}
            <Box
              display="flex"
              flexDirection={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', sm: 'center' }}
              gap={{ xs: 2, sm: 0 }}
            >
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {question.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    size="small"
                    sx={{
                      bgcolor: '#e0e7ff',
                      color: '#6366f1',
                      fontSize: '0.75rem',
                      '&:hover': { bgcolor: '#c7d2fe' }
                    }}
                  />
                ))}
              </Stack>

              <Box display="flex" alignItems="center" gap={1} justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}>
                <Avatar sx={{ width: 20, height: 20, fontSize: '0.75rem' }}>
                  {question.user.charAt(0)}
                </Avatar>
                <Typography variant="body2" color="text.secondary">
                  {question.user}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {question.timeAgo}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* Header */}
      <AppBar position="static" sx={{ bgcolor: '#232629', boxShadow: 'none', borderBottom: '1px solid #3c4146' }}>
        <Toolbar sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
          <Typography
            variant={{ xs: 'h5', sm: 'h4' }}
            component="div"
            sx={{
              fontWeight: 'bold',
              color: '#ec4899',
              cursor: 'pointer',
              fontSize: { xs: '1.75rem', sm: '2.125rem' }
            }}
            onClick={handleBackToQuestions}
          >
            StackIt
          </Typography>

          <Box sx={{ flexGrow: 1, mx: { xs: 1, sm: 2, md: 3 } }}>
            <TextField
              fullWidth
              placeholder="Search questions, tags, or users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: '#9fa6ad' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#3c4146',
                  color: 'white',
                  '& fieldset': { border: 'none' },
                  '&:hover fieldset': { border: 'none' },
                  '&.Mui-focused fieldset': { border: '1px solid #ec4899' },
                },
                '& .MuiInputBase-input::placeholder': {
                  color: '#9fa6ad',
                  opacity: 1,
                },
              }}
            />
          </Box>

          <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }}>
            {/* Notifications */}
            <IconButton
              onClick={handleNotificationClick}
              sx={{ color: '#9fa6ad', '&:hover': { color: '#ec4899' } }}
            >
              <Badge badgeContent={notifications} color="error">
                <Notifications />
              </Badge>
            </IconButton>

            <Menu
              anchorEl={notificationAnchor}
              open={Boolean(notificationAnchor)}
              onClose={handleNotificationClose}
            >
              <MenuItem onClick={handleNotificationClose}>
                New answer to your question
              </MenuItem>
              <MenuItem onClick={handleNotificationClose}>
                Someone mentioned you in a comment
              </MenuItem>
              <MenuItem onClick={handleNotificationClose}>
                Your answer was accepted
              </MenuItem>
            </Menu>

            <Button
              variant="contained"
              size="medium"
              sx={{
                bgcolor: '#ec4899',
                '&:hover': { bgcolor: '#db2777' },
                textTransform: 'none',
                fontWeight: 500,
                display: { xs: 'none', sm: 'flex' },
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              Login
            </Button>

            {/* Mobile Login Button */}
            <IconButton
              sx={{
                bgcolor: '#ec4899',
                '&:hover': { bgcolor: '#db2777' },
                color: 'white',
                display: { xs: 'flex', sm: 'none' }
              }}
            >
              <Person />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Conditional Rendering based on current view */}
      {currentView === 'questions' ? (
        /* Main Content - Questions List */
        <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
          <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={3}>
            {/* Main Content Area */}
            <Box flex={1}>
              {/* Action Bar */}
              <Box
                display="flex"
                flexDirection={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'stretch', sm: 'center' }}
                mb={3}
                gap={{ xs: 2, sm: 0 }}
              >
                <Typography variant={{ xs: 'h5', sm: 'h4' }} sx={{ fontWeight: 500 }}>
                  All Questions
                </Typography>

                <Button
                  variant="contained"
                  startIcon={<Add />}
                  fullWidth={{ xs: true, sm: false }}
                  sx={{
                    bgcolor: '#ec4899',
                    '&:hover': { bgcolor: '#db2777' },
                    textTransform: 'none',
                    fontWeight: 500
                  }}
                  onClick={handleAskQuestionOpen}
                >
                  Ask New Question
                </Button>
              </Box>

              {/* Filters */}
              <Box
                display="flex"
                flexDirection={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'stretch', sm: 'center' }}
                mb={3}
                gap={{ xs: 2, sm: 0 }}
              >
                <Typography variant="body1">
                  {sortedAndFilteredQuestions.length} questions
                  {searchTerm.trim() && sortedAndFilteredQuestions.length !== questions.length && (
                    <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 1 }}>
                      (filtered from {questions.length})
                    </Typography>
                  )}
                </Typography>

                <Box
                  display="flex"
                  flexDirection={{ xs: 'column', sm: 'row' }}
                  gap={1}
                  width={{ xs: '100%', sm: 'auto' }}
                >
                  <Button
                    variant={sortBy === 'Newest' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => setSortBy('Newest')}
                    sx={{
                      textTransform: 'none',
                      bgcolor: sortBy === 'Newest' ? '#6366f1' : 'transparent',
                      color: sortBy === 'Newest' ? 'white' : '#6366f1',
                      borderColor: '#6366f1',
                      '&:hover': {
                        bgcolor: sortBy === 'Newest' ? '#4f46e5' : '#f3f4f6',
                      }
                    }}
                    fullWidth={{ xs: true, sm: false }}
                  >
                    Newest
                  </Button>
                  <Button
                    variant={sortBy === 'Unanswered' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => setSortBy('Unanswered')}
                    sx={{
                      textTransform: 'none',
                      bgcolor: sortBy === 'Unanswered' ? '#6366f1' : 'transparent',
                      color: sortBy === 'Unanswered' ? 'white' : '#6366f1',
                      borderColor: '#6366f1',
                      '&:hover': {
                        bgcolor: sortBy === 'Unanswered' ? '#4f46e5' : '#f3f4f6',
                      }
                    }}
                    fullWidth={{ xs: true, sm: false }}
                  >
                    Unanswered
                  </Button>
                  <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 120 } }}>
                    <Select
                      value={sortBy === 'Most Voted' || sortBy === 'Most Viewed' ? sortBy : ''}
                      displayEmpty
                      onChange={(e) => setSortBy(e.target.value || 'Newest')}
                      sx={{
                        textTransform: 'none',
                        borderColor: '#6366f1',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#6366f1',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#4f46e5',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#6366f1',
                        },
                      }}
                      renderValue={(selected) => selected || 'more'}
                    >
                      <MenuItem value="Most Voted">Most Voted</MenuItem>
                      <MenuItem value="Most Viewed">Most Viewed</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              {/* Questions List */}
              <Box>
                {sortedAndFilteredQuestions.length > 0 ? (
                  sortedAndFilteredQuestions.map((question) => (
                    <QuestionCard key={question.id} question={question} />
                  ))
                ) : (
                  <Card sx={{ p: 4, textAlign: 'center', bgcolor: '#f8fafc' }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No questions found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {searchTerm.trim()
                        ? `No questions match "${searchTerm}" with the current filter "${sortBy}". Try different keywords or browse all questions.`
                        : sortBy === 'Unanswered'
                          ? "No unanswered questions available at the moment."
                          : "No questions available at the moment."
                      }
                    </Typography>
                    {(searchTerm.trim() || sortBy !== 'Newest') && (
                      <Box display="flex" justifyContent="center" gap={2} mt={2}>
                        {searchTerm.trim() && (
                          <Button
                            variant="outlined"
                            onClick={() => setSearchTerm('')}
                            sx={{ textTransform: 'none' }}
                          >
                            Clear search
                          </Button>
                        )}
                        {sortBy !== 'Newest' && (
                          <Button
                            variant="outlined"
                            onClick={() => setSortBy('Newest')}
                            sx={{ textTransform: 'none' }}
                          >
                            Show all questions
                          </Button>
                        )}
                      </Box>
                    )}
                  </Card>
                )}
              </Box>

              {/* Pagination */}
              <Box display="flex" justifyContent="center" mt={4}>
                <Pagination count={7} page={1} color="primary" />
              </Box>
            </Box>

            {/* Sidebar */}
            <Box
              width={{ xs: '100%', md: 300 }}
              sx={{ order: { xs: -1, md: 1 } }}
            >
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    The Overflow Blog
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    • Featured on Meta
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    • Hot Network Questions
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Community Guidelines
                  </Typography>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Watched Tags
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Stack
                    direction="row"
                    spacing={1}
                    flexWrap="wrap"
                    sx={{ gap: 1 }}
                  >
                    <Chip label="javascript" size="small" />
                    <Chip label="react" size="small" />
                    <Chip label="python" size="small" />
                    <Chip label="sql" size="small" />
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Container>
      ) : (
        /* Question Detail Page */
        <QuestionDetailPage question={selectedQuestion} />
      )}

      {/* Ask Question Dialog */}
      <Dialog
        open={askQuestionOpen}
        onClose={handleAskQuestionClose}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 3,
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h5" fontWeight="medium">
            Ask Question
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3}>
            {/* Title */}
            <Box>
              <Typography variant="body1" fontWeight="medium" sx={{ mb: 1 }}>
                Title
              </Typography>
              <TextField
                variant="outlined"
                fullWidth
                value={questionForm.title}
                onChange={(e) => handleQuestionFormChange('title', e.target.value)}
                placeholder="Enter a descriptive title for your question"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>

            {/* Description with Rich Text Editor */}
            <Box>
              <Typography variant="body1" fontWeight="medium" sx={{ mb: 1 }}>
                Description
              </Typography>

              {/* Rich Text Editor Toolbar */}
              <Box
                sx={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px 8px 0 0',
                  p: 1.5,
                  bgcolor: '#f5f5f5',
                  display: 'flex',
                  gap: 1,
                  flexWrap: 'wrap'
                }}
              >
                <IconButton size="small"><FormatBold /></IconButton>
                <IconButton size="small"><FormatItalic /></IconButton>
                <Divider orientation="vertical" flexItem />
                <IconButton size="small"><FormatListBulleted /></IconButton>
                <IconButton size="small"><FormatListNumbered /></IconButton>
                <Divider orientation="vertical" flexItem />
                <IconButton size="small"><EmojiEmotions /></IconButton>
                <IconButton size="small"><LinkIcon /></IconButton>
                <IconButton size="small"><Image /></IconButton>
                <Divider orientation="vertical" flexItem />
                <IconButton size="small"><FormatAlignLeft /></IconButton>
                <IconButton size="small"><FormatAlignCenter /></IconButton>
                <IconButton size="small"><FormatAlignRight /></IconButton>
              </Box>

              <TextField
                variant="outlined"
                fullWidth
                multiline
                rows={6}
                value={questionForm.description}
                onChange={(e) => handleQuestionFormChange('description', e.target.value)}
                placeholder="Provide a detailed description of your question..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '0 0 8px 8px',
                    '& fieldset': {
                      borderTop: 'none',
                    },
                  },
                }}
              />
            </Box>

            {/* Tags */}
            <Box>
              <Typography variant="body1" fontWeight="medium" sx={{ mb: 1 }}>
                Tags
              </Typography>
              <TextField
                variant="outlined"
                fullWidth
                value={questionForm.tags}
                onChange={(e) => handleQuestionFormChange('tags', e.target.value)}
                placeholder="Add relevant tags separated by commas (e.g., javascript, react, html)"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Box display="flex" justifyContent="center" width="100%">
            <Button
              onClick={handleSubmitQuestion}
              variant="contained"
              size="large"
              sx={{
                textTransform: 'none',
                bgcolor: '#6366f1',
                '&:hover': { bgcolor: '#4f46e5' },
                borderRadius: 2,
                px: 4,
                py: 1.5,
                fontWeight: 500
              }}
            >
              Submit
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

export default App;
