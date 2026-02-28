using UnityEngine;

public class WordComponent : MonoBehaviour
{
    public string word = "OPEN";

    private void OnTriggerEnter2D(Collider2D other)
    {
        Debug.Log("HIT");


        if (other.CompareTag("Player"))
        {
            Debug.Log("word hit player");
            PlayerMovement player = other.GetComponent<PlayerMovement>();
            player.PickUpWord(word, gameObject);
        }
    }
}
