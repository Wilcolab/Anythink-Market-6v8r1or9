/**
 * Comments API Router
 * 
 * Handles CRUD operations for comments on posts, including creation, retrieval,
 * and deletion of comments with proper validation and error handling.
 * 
 * @module routes/api/comments
 * @requires express
 * @requires mongoose
 */

/**
 * Validates if a string is a valid MongoDB ObjectId
 * 
 * @function validateObjectId
 * @param {string} id - The ID to validate
 * @returns {boolean} True if the ID is a valid MongoDB ObjectId, false otherwise
 */

/**
 * Validates comment input data
 * 
 * @function validateCommentInput
 * @param {string} content - The comment content
 * @param {string} author - The author user ID
 * @param {string} post - The post ID this comment belongs to
 * @returns {string[]} Array of validation error messages (empty if valid)
 */

/**
 * Creates a new comment in the database
 * 
 * @async
 * @function createComment
 * @param {string} content - The comment content (will be trimmed)
 * @param {string} author - Valid MongoDB ObjectId of the comment author
 * @param {string} post - Valid MongoDB ObjectId of the post being commented on
 * @returns {Promise<Object>} The created comment object with populated author data
 * @throws {Error} If validation fails or database operation fails
 */

/**
 * Retrieves all comments for a specific post
 * 
 * @async
 * @function getCommentsByPost
 * @param {string} postId - Valid MongoDB ObjectId of the post
 * @returns {Promise<Object[]>} Array of comment objects with populated author data
 * @throws {Error} If postId is not a valid MongoDB ObjectId
 */

/**
 * Deletes a comment from the database
 * 
 * @async
 * @function deleteComment
 * @param {string} commentId - Valid MongoDB ObjectId of the comment to delete
 * @returns {Promise<Object>} The deleted comment object
 * @throws {Error} If commentId is invalid or comment is not found
 */

/**
 * POST /
 * Creates a new comment
 * 
 * @route POST /
 * @param {Object} req.body - Request body
 * @param {string} req.body.content - Comment content
 * @param {string} req.body.author - Author user ID
 * @param {string} req.body.post - Post ID
 * @returns {Object} 201 - Created comment object
 * @returns {Object} 400 - Error message
 */

/**
 * GET /post/:postId
 * Retrieves all comments for a specific post
 * 
 * @route GET /post/:postId
 * @param {string} req.params.postId - The post ID
 * @returns {Object[]} 200 - Array of comments
 * @returns {Object} 400 - Error message
 */

/**
 * DELETE /:commentId
 * Deletes a specific comment
 * 
 * @route DELETE /:commentId
 * @param {string} req.params.commentId - The comment ID to delete
 * @returns {Object} 200 - Success message
 * @returns {Object} 404 - Error message if comment not found
 * @returns {Object} 400 - Error message for other errors
 */
const router = require("express").Router();
const mongoose = require("mongoose");
const Comment = mongoose.model("Comment");

// Validation helper
const validateObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const validateCommentInput = (content, author, post) => {
  const errors = [];
  if (!content || typeof content !== "string" || content.trim() === "") {
    errors.push("Content is required and must be a non-empty string");
  }
  if (!author || !validateObjectId(author)) {
    errors.push("Author must be a valid user ID");
  }
  if (!post || !validateObjectId(post)) {
    errors.push("Post must be a valid post ID");
  }
  return errors;
};

// Service functions
const createComment = async (content, author, post) => {
  const validationErrors = validateCommentInput(content, author, post);
  if (validationErrors.length > 0) {
    throw new Error(validationErrors.join(", "));
  }

  const comment = new Comment({
    content: content.trim(),
    author,
    post
  });

  await comment.save();
  return comment.populate("author");
};

const getCommentsByPost = async (postId) => {
  if (!validateObjectId(postId)) {
    throw new Error("Invalid post ID");
  }

  return await Comment.find({ post: postId }).populate("author").lean();
};

const deleteComment = async (commentId) => {
  if (!validateObjectId(commentId)) {
    throw new Error("Invalid comment ID");
  }

  const comment = await Comment.findByIdAndDelete(commentId);
  if (!comment) {
    throw new Error("Comment not found");
  }

  return comment;
};

// Routes
router.post("/", async (req, res) => {
  try {
    const { content, author, post } = req.body;
    const comment = await createComment(content, author, post);
    res.status(201).json(comment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/post/:postId", async (req, res) => {
  try {
    const comments = await getCommentsByPost(req.params.postId);
    res.json(comments);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:commentId", async (req, res) => {
  try {
    await deleteComment(req.params.commentId);
    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    const statusCode = err.message === "Comment not found" ? 404 : 400;
    res.status(statusCode).json({ error: err.message });
  }
});

module.exports = router;
