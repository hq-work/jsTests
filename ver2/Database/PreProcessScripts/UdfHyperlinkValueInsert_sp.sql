CREATE PROCEDURE UdfHyperlinkValueInsert_sp
	@ID						UNIQUEIDENTIFIER,
	@UdfID					UNIQUEIDENTIFIER,
	@ObjectID				UNIQUEIDENTIFIER,
	@Label					VARCHAR(500),
	@Url					VARCHAR(3000),
	@Order					INT,
	@HyperlinkObjectID		UNIQUEIDENTIFIER
AS
	SET NOCOUNT ON

	INSERT INTO UDFHyperlinkValue(ID, UdfID, ObjectID, Label, Url, [Order], HyperlinkObjectID)
	VALUES (@ID, @UdfID, @ObjectID, @Label, @Url, @Order, @HyperlinkObjectID)
