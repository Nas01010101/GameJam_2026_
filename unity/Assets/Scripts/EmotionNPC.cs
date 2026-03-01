using UnityEngine;
using UnityEngine.InputSystem;

public class EmotionNPC : MonoBehaviour
{
    public EmotionData emotion;
    public GameObject emojiHint;
    //public Transform[] respawnPoints;
    RespawnPoint currentPoint;

    private Vector3 originalPosition;

    //public EmotionData emotion;   // The emotion this NPC represents
    private GameObject dialogueBox;  // Reference to child sprite
    private bool playerNear = false;
    private bool collected = false;

    void Start()
    {

        // Find the child dialogue box
        dialogueBox = transform.Find("DialogueBox_" + emotion.name)?.gameObject;

        if (dialogueBox != null)
            dialogueBox.SetActive(false);  // keep it hidden initially
        originalPosition = transform.position;
        RespawnPoint startPoint =
       RespawnManager.Instance.GetFreePoint();

        if (startPoint != null)
        {
            transform.position = startPoint.transform.position;
            currentPoint = startPoint;
            RespawnManager.Instance.Occupy(currentPoint);
        }
    }

    void Update()
    {
        if (playerNear && Keyboard.current.fKey.wasPressedThisFrame && !collected)
        {
            GuessUI.Instance.Open(this);
        }
    }

    void OnTriggerStay2D(Collider2D other)
    {
        if (other.CompareTag("Player") &&
            Keyboard.current.eKey.wasPressedThisFrame)
        {
            GuessUI.Instance.Open(this);
        }
    }

    void OnTriggerExit2D(Collider2D other)
    {
        if (other.CompareTag("Player"))
        {
            playerNear = false;
            if (dialogueBox != null)
                dialogueBox.SetActive(false); // hide when player walks away
        }
    }

    public void CorrectAnswer()
    {

        /*
        emojiHint.SetActive(false);
        GiveStone();
        gameObject.SetActive(false);*/

        collected = true;

        if (dialogueBox != null)
            dialogueBox.SetActive(false);  // hide the box forever

        StoneInventory.Instance.Collect(emotion);

        // Spawn stone
        Instantiate(GameManager.Instance.stonePrefab, transform.position + Vector3.up, Quaternion.identity);

        gameObject.SetActive(false); // NPC cannot interact again
    }

    public void WrongAnswer()
    {
        if (dialogueBox != null)
            dialogueBox.SetActive(false); // hide dialogue temporarily
        RespawnSomewhere();
    }

    public void RespawnSomewhere()
    {
        // free old point
        if (currentPoint != null)
            RespawnManager.Instance.Release(currentPoint);

        RespawnPoint newPoint =
            RespawnManager.Instance.GetFreePoint();

        if (newPoint == null) return;

        transform.position = newPoint.transform.position;

        currentPoint = newPoint;
        RespawnManager.Instance.Occupy(currentPoint);
    }


    /*
    void RespawnSomewhere()
    {
        int rand = Random.Range(0, respawnPoints.Length);
        transform.position = respawnPoints[rand].position;
    }
    */
    void GiveStone()
    {
        StoneInventory.Instance.Collect(emotion);

        Instantiate(
            GameManager.Instance.stonePrefab,
            transform.position + Vector3.up,
            Quaternion.identity);
    }
}